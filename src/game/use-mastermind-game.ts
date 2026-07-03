import type { FormEvent } from "react";
import { useState } from "react";
import {
  MASTERMIND_CODE_LENGTH,
  MASTERMIND_COLORS,
  MASTERMIND_MAX_ATTEMPTS,
  getMastermindFeedback,
  getScoreForMode,
  normalizeMastermindGuess,
  type MastermindAttempt,
  type MastermindColorId,
  type MastermindGameState,
} from "../../shared/game";
import { apiJson, useApiResource } from "../lib/api";
import { emptyMastermindGame } from "./state";

function randomLocalAnswer(): MastermindColorId[] {
  return Array.from({ length: MASTERMIND_CODE_LENGTH }, () => {
    const color = MASTERMIND_COLORS[Math.floor(Math.random() * MASTERMIND_COLORS.length)];
    return color.id;
  });
}

function newLocalRound(gamesPlayed: number): MastermindGameState {
  return {
    ...emptyMastermindGame,
    gameId: `local-mastermind-${gamesPlayed + 1}`,
    answer: randomLocalAnswer(),
    over: false,
    status: "active",
    gamesPlayed: gamesPlayed + 1,
  };
}

function notifyScore(score: number): void {
  window.dispatchEvent(new CustomEvent("smotu:score", { detail: { score } }));
}

export function useMastermindGame(enabled: boolean) {
  const gameResource = useApiResource<MastermindGameState>(
    "/api/game/mastermind",
    enabled,
    emptyMastermindGame,
  );
  const [localGame, setLocalGame] =
    useState<MastermindGameState>(emptyMastermindGame);
  const [guess, setGuess] = useState<MastermindColorId[]>([]);
  const [localError, setLocalError] = useState("");
  const [pendingGuess, setPendingGuess] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState("");

  const game = enabled ? gameResource.data : localGame;
  const progress = Math.round((game.attempts.length / game.maxAttempts) * 100);
  const canSubmit =
    game.status === "active" &&
    guess.length === MASTERMIND_CODE_LENGTH &&
    !game.over &&
    !pendingGuess;

  async function startRound() {
    setGuess([]);
    setLocalError("");
    setPendingGuess(false);

    if (!enabled) {
      setLocalGame((current) => newLocalRound(current.gamesPlayed));
      return;
    }

    setIsStarting(true);

    try {
      gameResource.setData(
        await apiJson<MastermindGameState>("/api/game/mastermind/start", {
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

    if (game.status !== "active") {
      setLocalError("Lance une manche Mastermind avant de proposer un code.");
      return;
    }
    if (guess.length !== MASTERMIND_CODE_LENGTH || game.over || pendingGuess) {
      return;
    }

    if (!enabled) {
      const attemptNumber = game.attempts.length + 1;
      const answer = normalizeMastermindGuess(game.answer);
      const feedback = getMastermindFeedback(guess, answer);
      const solved = feedback.exact === MASTERMIND_CODE_LENGTH;
      const failed = !solved && attemptNumber >= MASTERMIND_MAX_ATTEMPTS;
      const attempt: MastermindAttempt = {
        id: `local-mastermind-${attemptNumber}`,
        guess,
        exact: feedback.exact,
        present: feedback.present,
        attemptNumber,
        solved,
        score: solved ? getScoreForMode("mastermind", attemptNumber) : 0,
        createdAt: new Date().toISOString(),
      };

      setLocalError("");
      setGuess([]);
      setLocalGame((current) => ({
        ...current,
        attempts: [...current.attempts, attempt],
        solved,
        over: solved || failed,
        status: solved ? "solved" : failed ? "failed" : "active",
      }));

      if (solved) {
        setCelebrationKey(`${game.gameId}-${attempt.id}-${Date.now()}`);
        notifyScore(attempt.score);
      }
      return;
    }

    setLocalError("");
    setPendingGuess(true);

    try {
      const nextGame = await apiJson<MastermindGameState>(
        "/api/game/mastermind/guess",
        {
          method: "POST",
          body: JSON.stringify({ guess }),
        },
      );
      const winningAttempt = nextGame.attempts.find((attempt) => attempt.solved);

      gameResource.setData(nextGame);
      setGuess([]);

      if (!game.solved && winningAttempt) {
        setCelebrationKey(`${nextGame.gameId}-${winningAttempt.id}-${Date.now()}`);
        notifyScore(winningAttempt.score);
      }
    } catch (reason) {
      setLocalError(
        reason instanceof Error ? reason.message : "Impossible d'envoyer ce code.",
      );
    } finally {
      setPendingGuess(false);
    }
  }

  async function abandonRound() {
    if (game.status !== "active" || game.over || pendingGuess || isAbandoning) {
      return;
    }

    setLocalError("");
    setGuess([]);

    if (!enabled) {
      setLocalGame((current) => ({
        ...emptyMastermindGame,
        gamesPlayed: current.gamesPlayed,
      }));
      return;
    }

    setIsAbandoning(true);

    try {
      gameResource.setData(
        await apiJson<MastermindGameState>("/api/game/mastermind/abandon", {
          method: "POST",
        }),
      );
    } catch (reason) {
      setLocalError(
        reason instanceof Error ? reason.message : "Impossible d'abandonner.",
      );
    } finally {
      setIsAbandoning(false);
    }
  }

  return {
    abandonRound,
    celebrationKey,
    canSubmit,
    error: gameResource.error,
    game,
    guess,
    isAbandoning,
    isStarting,
    loading: gameResource.loading,
    localError,
    pendingGuess,
    progress,
    startRound,
    addColor: (color: MastermindColorId) => {
      setLocalError("");
      setGuess((value) =>
        value.length >= MASTERMIND_CODE_LENGTH ? value : [...value, color],
      );
    },
    clearGuess: () => {
      setLocalError("");
      setGuess([]);
    },
    removeColor: () => {
      setLocalError("");
      setGuess((value) => value.slice(0, -1));
    },
    onSubmit,
  };
}
