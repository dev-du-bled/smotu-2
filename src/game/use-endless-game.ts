import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  MAX_ATTEMPTS,
  WORD_LENGTH,
  WORD_LENGTH_OPTIONS,
  getEndlessLossPenalty,
  getPattern,
  getScoreForMode,
  isKnownWord,
  normalizeGuess,
  normalizeWordLength,
  randomWord,
  type Attempt,
  type EndlessGameState,
  type WordLengthOption,
} from "../../shared/game";
import { apiJson, useApiResource } from "../lib/api";
import { emptyEndlessGame, letterStates } from "./state";

// Manche libre jouée entièrement côté navigateur pour les visiteurs non connectés.
// ponytail: pas de persistance ni de classement pour l'anonyme (décidé), tout en state React.
function newLocalRound(
  gamesPlayed: number,
  wordLength: WordLengthOption,
): EndlessGameState {
  return {
    ...emptyEndlessGame,
    gameId: `local-${gamesPlayed + 1}`,
    dateKey: `Libre #${gamesPlayed + 1}`,
    status: "active",
    over: false,
    answer: randomWord(wordLength),
    wordLength,
    gamesPlayed: gamesPlayed + 1,
    attempts: [],
  };
}

function notifyScore(score: number): void {
  window.dispatchEvent(new CustomEvent("smotu:score", { detail: { score } }));
}

export function useEndlessGame(signedIn: boolean) {
  const gameResource = useApiResource<EndlessGameState>(
    "/api/game/endless",
    signedIn,
    emptyEndlessGame,
  );
  const [localGame, setLocalGame] = useState<EndlessGameState>(emptyEndlessGame);
  const [inputValue, setInputValue] = useState("");
  const [pendingGuess, setPendingGuess] = useState("");
  const [localError, setLocalError] = useState("");
  const [celebrationKey, setCelebrationKey] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);
  const [selectedWordLength, setSelectedWordLength] =
    useState<WordLengthOption>(WORD_LENGTH);

  const game = signedIn ? gameResource.data : localGame;

  useEffect(() => {
    if (game.status === "active") {
      setSelectedWordLength(normalizeWordLength(game.wordLength));
    }
  }, [game.status, game.wordLength]);

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
    inputValue.length === game.wordLength &&
    !game.over &&
    !pendingGuess;

  async function startRound(wordLength = selectedWordLength) {
    const nextWordLength = normalizeWordLength(wordLength);
    setInputValue("");
    setPendingGuess("");
    setLocalError("");
    setSelectedWordLength(nextWordLength);

    if (!signedIn) {
      setLocalGame((current) => newLocalRound(current.gamesPlayed, nextWordLength));
      return;
    }

    setIsStarting(true);

    try {
      gameResource.setData(
        await apiJson<EndlessGameState>("/api/game/endless/start", {
          method: "POST",
          body: JSON.stringify({ wordLength: nextWordLength }),
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
    const guess = normalizeGuess(inputValue, game.wordLength);

    if (game.status !== "active") {
      setLocalError("Lance une manche libre avant de proposer un mot.");
      return;
    }
    if (guess.length !== game.wordLength || game.over || pendingGuess) {
      return;
    }
    if (!isKnownWord(guess, game.wordLength)) {
      setLocalError("Ce mot n'est pas dans le dictionnaire.");
      return;
    }

    if (!signedIn) {
      const attemptNumber = game.attempts.length + 1;
      const solved = guess === game.answer;
      const failed = !solved && attemptNumber >= MAX_ATTEMPTS;
      const attempt: Attempt = {
        id: `local-${attemptNumber}`,
        guess,
        pattern: getPattern(guess, game.answer),
        attemptNumber,
        solved,
        score: solved
          ? getScoreForMode("endless", attemptNumber, game.wordLength)
          : 0,
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
        notifyScore(attempt.score);
      } else if (failed) {
        notifyScore(-getEndlessLossPenalty(game.wordLength));
      }
      return;
    }

    setLocalError("");
    setPendingGuess(guess);
    setInputValue("");

    try {
      const nextGame = await apiJson<EndlessGameState>(
        "/api/game/endless/guess",
        {
          method: "POST",
          body: JSON.stringify({ guess }),
        },
      );
      const winningAttempt = nextGame.attempts.find((attempt) => attempt.solved);

      gameResource.setData(nextGame);

      if (!game.solved && winningAttempt) {
        setCelebrationKey(`${nextGame.gameId}-${winningAttempt.id}-${Date.now()}`);
        notifyScore(winningAttempt.score);
      } else if (game.status === "active" && nextGame.status === "failed") {
        notifyScore(-getEndlessLossPenalty(nextGame.wordLength));
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

  async function abandonRound() {
    if (game.status !== "active" || game.over || pendingGuess || isAbandoning) {
      return;
    }

    setLocalError("");
    setInputValue("");
    setPendingGuess("");

    if (!signedIn) {
      setLocalGame((current) => ({
        ...emptyEndlessGame,
        gamesPlayed: current.gamesPlayed,
      }));
      return;
    }

    setIsAbandoning(true);
    const abandonedWordLength = game.wordLength;

    try {
      gameResource.setData(
        await apiJson<EndlessGameState>("/api/game/endless/abandon", {
          method: "POST",
        }),
      );
      notifyScore(-getEndlessLossPenalty(abandonedWordLength));
    } catch (reason) {
      setLocalError(
        reason instanceof Error ? reason.message : "Impossible d'abandonner.",
      );
    } finally {
      setIsAbandoning(false);
    }
  }

  return {
    error: gameResource.error,
    game,
    isAbandoning,
    isStarting,
    loading: gameResource.loading,
    selectedWordLength,
    setSelectedWordLength: (wordLength: WordLengthOption) => {
      setSelectedWordLength(wordLength);
      setInputValue((value) => normalizeGuess(value, wordLength));
    },
    abandonRound,
    startRound,
    wordLengthOptions: WORD_LENGTH_OPTIONS,
    playProps: {
      activeRow,
      canSubmit,
      celebrationKey,
      game,
      inputValue,
      localError,
      lossPenalty: getEndlessLossPenalty(game.wordLength),
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
