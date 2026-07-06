import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  MAX_ATTEMPTS,
  WORD_LENGTH,
  getPattern,
  getScoreForMode,
  getWordForDate,
  isKnownWord,
  normalizeGuess,
  type Attempt,
  type GameState,
  type GlobalLeaderboardEntry,
  type LeaderboardSet,
} from "../../shared/game";
import { apiJson, useApiResource } from "../lib/api";
import { emptyGame, emptyLeaderboard, emptyLeaderboards, letterStates } from "./state";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function newLocalDailyGame(): GameState {
  const dateKey = todayKey();

  return {
    ...emptyGame,
    dateKey,
    answer: getWordForDate(dateKey),
  };
}

function notifyScore(score: number): void {
  window.dispatchEvent(new CustomEvent("smotu:score", { detail: { score } }));
}

export function useGlobalLeaderboard(enabled: boolean) {
  return useApiResource<GlobalLeaderboardEntry[]>(
    "/api/leaderboard/global",
    enabled,
    emptyLeaderboard,
  );
}

export function useLeaderboards(enabled: boolean) {
  return useApiResource<LeaderboardSet>(
    "/api/leaderboards",
    enabled,
    emptyLeaderboards,
  );
}

export function useDailyGame(enabled: boolean) {
  const gameResource = useApiResource<GameState>(
    "/api/game/daily",
    enabled,
    emptyGame,
  );
  const [localGame, setLocalGame] = useState<GameState>(newLocalDailyGame);
  const [inputValue, setInputValue] = useState("");
  const [pendingGuess, setPendingGuess] = useState("");
  const [localError, setLocalError] = useState("");
  const [celebrationKey, setCelebrationKey] = useState("");

  const game = enabled ? gameResource.data : localGame;
  const visibleAttempts = pendingGuess
    ? [
        ...game.attempts,
        {
          id: "pending",
          guess: pendingGuess,
          pattern: [],
          attemptNumber: game.attempts.length + 1,
          solved: false,
          score: 0,
          createdAt: "",
        },
      ]
    : game.attempts;

  const rows = Array.from(
    { length: game.maxAttempts },
    (_, index) => visibleAttempts[index],
  );
  const states = useMemo(() => letterStates(game.attempts), [game.attempts]);
  const solvedAttempt = game.attempts.find((attempt) => attempt.solved);
  const activeRow = Math.min(visibleAttempts.length, game.maxAttempts - 1);
  const progress = Math.round((game.attempts.length / game.maxAttempts) * 100);
  const canSubmit =
    inputValue.length === game.wordLength && !game.over && !pendingGuess;

  async function onSubmit(event?: FormEvent) {
    event?.preventDefault();
    const guess = normalizeGuess(inputValue, game.wordLength);

    if (guess.length !== WORD_LENGTH || game.over || pendingGuess) {
      return;
    }
    if (!isKnownWord(guess, game.wordLength)) {
      setLocalError("Ce mot n'est pas dans le dictionnaire.");
      return;
    }

    if (!enabled) {
      const attemptNumber = game.attempts.length + 1;
      const answer = game.answer || getWordForDate(game.dateKey);
      const solved = guess === answer;
      const failed = !solved && attemptNumber >= MAX_ATTEMPTS;
      const attempt: Attempt = {
        id: `local-daily-${attemptNumber}`,
        guess,
        pattern: getPattern(guess, answer),
        attemptNumber,
        solved,
        score: solved ? getScoreForMode("daily", attemptNumber) : 0,
        createdAt: new Date().toISOString(),
      };

      setLocalError("");
      setInputValue("");
      setLocalGame((current) => ({
        ...current,
        attempts: [...current.attempts, attempt],
        solved,
        over: solved || failed,
        answer,
      }));

      if (solved) {
        setCelebrationKey(`${game.dateKey}-${attempt.id}-${Date.now()}`);
        notifyScore(attempt.score);
      }
      return;
    }

    setLocalError("");
    setPendingGuess(guess);
    setInputValue("");

    try {
      const nextGame = await apiJson<GameState>("/api/game/daily/guess", {
        method: "POST",
        body: JSON.stringify({ guess }),
      });
      const winningAttempt = nextGame.attempts.find((attempt) => attempt.solved);

      gameResource.setData(nextGame);

      if (!game.solved && winningAttempt) {
        setCelebrationKey(`${nextGame.dateKey}-${winningAttempt.id}-${Date.now()}`);
        notifyScore(winningAttempt.score);
      }
    } catch (reason) {
      setInputValue(guess);
      setLocalError(
        reason instanceof Error ? reason.message : "Impossible d'envoyer ce mot.",
      );
    } finally {
      setPendingGuess("");
    }
  }

  return {
    error: gameResource.error,
    game,
    loading: gameResource.loading,
    playProps: {
      activeRow,
      canSubmit,
      celebrationKey,
      debugAnswer: game.answer || getWordForDate(game.dateKey),
      game,
      inputValue,
      localError,
      pendingGuess,
      progress,
      rows,
      solvedAttempt,
      states,
      onBackspace: () => {
        setLocalError("");
        setInputValue((value) => value.slice(0, -1));
      },
      onInput: (value: string) => {
        setLocalError("");
        setInputValue(normalizeGuess(value, game.wordLength));
      },
      onLetter: (letter: string) => {
        setLocalError("");
        setInputValue((value) => normalizeGuess(`${value}${letter}`, game.wordLength));
      },
      onSubmit,
    },
  };
}
