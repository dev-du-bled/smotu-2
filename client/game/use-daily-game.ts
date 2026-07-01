import { useMutation, useQuery } from "lakebed/client";
import { useState } from "preact/hooks";
import {
  normalizeGuess,
  WORD_LENGTH,
  type Attempt,
  type GameState,
  type LeaderboardEntry,
} from "../../shared/game";
import { letterStates, normalizeGame } from "./state";

export function useDailyGame() {
  const game = normalizeGame(useQuery<GameState>("game"));
  const leaderboardQuery = useQuery<LeaderboardEntry[]>("leaderboard");
  const leaderboard = Array.isArray(leaderboardQuery) ? leaderboardQuery : [];
  const submitGuess = useMutation<[guess: string], Attempt | null>(
    "submitGuess",
  );
  const [inputValue, setInputValue] = useState("");
  const [pendingGuess, setPendingGuess] = useState("");
  const [localError, setLocalError] = useState("");

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
    inputValue.length === WORD_LENGTH && !game.over && !pendingGuess;
  const bestScore = leaderboard[0]?.score ?? 0;

  async function onSubmit(event?: SubmitEvent) {
    event?.preventDefault();
    const guess = normalizeGuess(inputValue);

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
    bestScore,
    game,
    leaderboard,
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
