import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  MAX_ATTEMPTS,
  WORDS,
  WORD_LENGTH,
  getPattern,
  getScoreForMode,
  normalizeGuess,
  type Attempt,
  type EndlessGameState,
} from "../../shared/game";
import { apiJson, useApiResource } from "../lib/api";
import { emptyEndlessGame, letterStates } from "./state";

// Manche libre jouée entièrement côté navigateur pour les visiteurs non connectés.
// ponytail: pas de persistance ni de classement pour l'anonyme (décidé), tout en state React.
function newLocalRound(gamesPlayed: number): EndlessGameState {
  return {
    ...emptyEndlessGame,
    gameId: `local-${gamesPlayed + 1}`,
    dateKey: `Libre #${gamesPlayed + 1}`,
    status: "active",
    over: false,
    answer: WORDS[Math.floor(Math.random() * WORDS.length)],
    gamesPlayed: gamesPlayed + 1,
    attempts: [],
  };
}

export function useEndlessGame(token: string | undefined) {
  const gameResource = useApiResource<EndlessGameState>(
    "/api/game/endless",
    token,
    emptyEndlessGame,
  );
  const [localGame, setLocalGame] = useState<EndlessGameState>(emptyEndlessGame);
  const [inputValue, setInputValue] = useState("");
  const [pendingGuess, setPendingGuess] = useState("");
  const [localError, setLocalError] = useState("");
  const [celebrationKey, setCelebrationKey] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const game = token ? gameResource.data : localGame;
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
    game.status === "active" &&
    inputValue.length === WORD_LENGTH &&
    !game.over &&
    !pendingGuess;

  async function startRound() {
    setInputValue("");
    setPendingGuess("");
    setLocalError("");

    if (!token) {
      setLocalGame((current) => newLocalRound(current.gamesPlayed));
      return;
    }

    setIsStarting(true);

    try {
      gameResource.setData(
        await apiJson<EndlessGameState>("/api/game/endless/start", token, {
          method: "POST",
        }),
      );
    } catch (reason) {
      setLocalError(
        reason instanceof Error ? reason.message : "Impossible de lancer la manche.",
      );
    } finally {
      setIsStarting(false);
    }
  }

  async function onSubmit(event?: FormEvent) {
    event?.preventDefault();
    const guess = normalizeGuess(inputValue);

    if (game.status !== "active") {
      setLocalError("Lance une manche libre avant de proposer un mot.");
      return;
    }
    if (guess.length !== WORD_LENGTH || game.over || pendingGuess) {
      return;
    }

    if (!token) {
      const attemptNumber = game.attempts.length + 1;
      const solved = guess === game.answer;
      const failed = !solved && attemptNumber >= MAX_ATTEMPTS;
      const attempt: Attempt = {
        id: `local-${attemptNumber}`,
        guess,
        pattern: getPattern(guess, game.answer),
        attemptNumber,
        solved,
        score: solved ? getScoreForMode("endless", attemptNumber) : 0,
        createdAt: new Date().toISOString(),
      };
      setLocalError("");
      setInputValue("");
      setLocalGame((current) => ({
        ...current,
        attempts: [...current.attempts, attempt],
        solved,
        over: solved || failed,
        status: solved ? "solved" : failed ? "failed" : "active",
      }));
      if (solved) {
        setCelebrationKey(`${game.gameId}-${attempt.id}-${Date.now()}`);
      }
      return;
    }

    setLocalError("");
    setPendingGuess(guess);
    setInputValue("");

    try {
      const nextGame = await apiJson<EndlessGameState>(
        "/api/game/endless/guess",
        token,
        {
          method: "POST",
          body: JSON.stringify({ guess }),
        },
      );
      const winningAttempt = nextGame.attempts.find((attempt) => attempt.solved);

      gameResource.setData(nextGame);

      if (!game.solved && winningAttempt) {
        setCelebrationKey(`${nextGame.gameId}-${winningAttempt.id}-${Date.now()}`);
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
    isStarting,
    loading: gameResource.loading,
    startRound,
    playProps: {
      activeRow,
      canSubmit,
      celebrationKey,
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
