import type { FormEvent } from "react";
import { useState } from "react";
import {
  MASTERMIND_CODE_LENGTH,
  type MastermindColorId,
  type MastermindGameState,
} from "../../shared/game";
import { apiJson, useApiResource } from "../lib/api";
import { emptyMastermindGame } from "./state";

export function useMastermindGame(enabled: boolean) {
  const gameResource = useApiResource<MastermindGameState>(
    "/api/game/mastermind",
    enabled,
    emptyMastermindGame,
  );
  const [guess, setGuess] = useState<MastermindColorId[]>([]);
  const [localError, setLocalError] = useState("");
  const [pendingGuess, setPendingGuess] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [celebrationKey, setCelebrationKey] = useState("");

  const game = gameResource.data;
  const progress = Math.round((game.attempts.length / game.maxAttempts) * 100);
  const canSubmit =
    enabled &&
    game.status === "active" &&
    guess.length === MASTERMIND_CODE_LENGTH &&
    !game.over &&
    !pendingGuess;

  async function startRound() {
    if (!enabled) {
      setLocalError("Connecte-toi pour lancer Mastermind.");
      return;
    }

    setGuess([]);
    setLocalError("");
    setPendingGuess(false);
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

    if (!enabled) {
      setLocalError("Connecte-toi pour jouer.");
      return;
    }
    if (game.status !== "active") {
      setLocalError("Lance une manche Mastermind avant de proposer un code.");
      return;
    }
    if (guess.length !== MASTERMIND_CODE_LENGTH || game.over || pendingGuess) {
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
      }
    } catch (reason) {
      setLocalError(
        reason instanceof Error ? reason.message : "Impossible d'envoyer ce code.",
      );
    } finally {
      setPendingGuess(false);
    }
  }

  return {
    celebrationKey,
    canSubmit,
    error: gameResource.error,
    game,
    guess,
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
