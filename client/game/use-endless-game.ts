import { useMutation, useQuery } from "lakebed/client";
import { useState } from "preact/hooks";
import {
  normalizeGuess,
  WORD_LENGTH,
  type Attempt,
  type EndlessGameState,
} from "../../shared/game";
import { letterStates, normalizeEndlessGame } from "./state";

export function useEndlessGame() {
  const game = normalizeEndlessGame(useQuery<EndlessGameState>("endlessGame"));
  const startGame = useMutation<[], EndlessGameState>("startEndlessGame");
  const submitGuess = useMutation<[guess: string], Attempt | null>(
    "submitEndlessGuess",
  );
  const [inputValue, setInputValue] = useState("");
  const [pendingGuess, setPendingGuess] = useState("");
  const [localError, setLocalError] = useState("");
  const [isStarting, setIsStarting] = useState(false);

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
  const activeRow = Math.min(visibleAttempts.length, game.maxAttempts - 1);
  const states = letterStates(game.attempts);
  const solvedAttempt = game.attempts.find((attempt) => attempt.solved);
  const progress = Math.round((game.attempts.length / game.maxAttempts) * 100);
  const canSubmit =
    game.status === "active" &&
    inputValue.length === WORD_LENGTH &&
    !game.over &&
    !pendingGuess;

  async function startRound() {
    setLocalError("");
    setInputValue("");
    setPendingGuess("");
    setIsStarting(true);

    try {
      await startGame();
    } finally {
      setIsStarting(false);
    }
  }

  async function onSubmit(event?: SubmitEvent) {
    event?.preventDefault();
    const guess = normalizeGuess(inputValue);

    if (game.status !== "active") {
      setLocalError("Lance une manche libre avant de proposer un mot.");
      return;
    }

    if (guess.length !== WORD_LENGTH || game.over || pendingGuess) {
      return;
    }

    setLocalError("");
    setPendingGuess(guess);
    setInputValue("");

    try {
      const result = await submitGuess(guess);
      if (!result) {
        setLocalError("Impossible d'envoyer cette proposition.");
        setInputValue(guess);
      }
    } finally {
      setPendingGuess("");
    }
  }

  return {
    game,
    isStarting,
    startRound,
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
