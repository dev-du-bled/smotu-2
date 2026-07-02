import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  WORD_LENGTH,
  normalizeGuess,
  type Attempt,
  type GameState,
  type GlobalLeaderboardEntry,
} from "../../shared/game";
import { apiJson, useApiResource } from "../lib/api";
import { emptyGame, emptyLeaderboard, letterStates } from "./state";

export function useGlobalLeaderboard(token: string | undefined) {
  return useApiResource<GlobalLeaderboardEntry[]>(
    "/api/leaderboard/global",
    token,
    emptyLeaderboard,
  );
}

export function useDailyGame(token: string | undefined) {
  const gameResource = useApiResource<GameState>("/api/game/daily", token, emptyGame);
  const [inputValue, setInputValue] = useState("");
  const [pendingGuess, setPendingGuess] = useState("");
  const [localError, setLocalError] = useState("");

  const game = gameResource.data;
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
    Boolean(token) && inputValue.length === WORD_LENGTH && !game.over && !pendingGuess;

  async function onSubmit(event?: FormEvent) {
    event?.preventDefault();
    const guess = normalizeGuess(inputValue);

    if (!token) {
      setLocalError("Connecte-toi avec Google pour jouer.");
      return;
    }
    if (guess.length !== WORD_LENGTH || game.over || pendingGuess) {
      return;
    }

    setLocalError("");
    setPendingGuess(guess);
    setInputValue("");

    try {
      gameResource.setData(
        await apiJson<GameState>("/api/game/daily/guess", token, {
          method: "POST",
          body: JSON.stringify({ guess }),
        }),
      );
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
        setInputValue(normalizeGuess(value));
      },
      onLetter: (letter: string) => {
        setLocalError("");
        setInputValue((value) => normalizeGuess(`${value}${letter}`));
      },
      onSubmit,
    },
  };
}
