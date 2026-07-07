import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  MAX_ATTEMPTS,
  WORD_LENGTH,
  WORD_LENGTH_OPTIONS,
  getPattern,
  isKnownWord,
  normalizeGuess,
  normalizeWordLength,
  randomWord,
  type Attempt,
  type GameState,
  type WordLengthOption,
} from "../../shared/game";
import { emptyGame, letterStates } from "./state";

export const TIMED_GAME_SECONDS = 120;

function newRound(wordLength: WordLengthOption, round: number): GameState {
  return {
    ...emptyGame,
    dateKey: `Chrono #${round}`,
    answer: randomWord(wordLength),
    attempts: [],
    maxAttempts: MAX_ATTEMPTS,
    over: false,
    solved: false,
    wordLength,
  };
}

export function useTimedGame() {
  const [status, setStatus] = useState<"idle" | "active" | "finished">("idle");
  const [selectedWordLength, setSelectedWordLength] =
    useState<WordLengthOption>(WORD_LENGTH);
  const [game, setGame] = useState<GameState>(emptyGame);
  const [inputValue, setInputValue] = useState("");
  const [localError, setLocalError] = useState("");
  const [celebrationKey, setCelebrationKey] = useState("");
  const [timeLeft, setTimeLeft] = useState(TIMED_GAME_SECONDS);
  const [wordsSolved, setWordsSolved] = useState(0);
  const [wordsSkipped, setWordsSkipped] = useState(0);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (status !== "active") {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setStatus("finished");
          setGame((currentGame) => ({ ...currentGame, over: true }));
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status]);

  const rows = Array.from({ length: game.maxAttempts }, (_, index) => game.attempts[index]);
  const states = useMemo(() => letterStates(game.attempts), [game.attempts]);
  const activeRow = Math.min(game.attempts.length, game.maxAttempts - 1);
  const progress = Math.round(((TIMED_GAME_SECONDS - timeLeft) / TIMED_GAME_SECONDS) * 100);
  const canSubmit =
    status === "active" && inputValue.length === game.wordLength && !game.over;

  function nextWord(nextRound: number, wordLength = selectedWordLength) {
    setRound(nextRound);
    setGame(newRound(wordLength, nextRound));
    setInputValue("");
    setLocalError("");
  }

  function startGame(wordLength = selectedWordLength) {
    const nextWordLength = normalizeWordLength(wordLength);
    setSelectedWordLength(nextWordLength);
    setStatus("active");
    setTimeLeft(TIMED_GAME_SECONDS);
    setWordsSolved(0);
    setWordsSkipped(0);
    nextWord(1, nextWordLength);
  }

  function skipWord() {
    if (status !== "active") {
      return;
    }
    setWordsSkipped((value) => value + 1);
    nextWord(round + 1);
  }

  function onSubmit(event?: FormEvent) {
    event?.preventDefault();
    const guess = normalizeGuess(inputValue, game.wordLength);

    if (status !== "active") {
      return;
    }
    if (guess.length !== game.wordLength || game.over) {
      return;
    }
    if (!isKnownWord(guess, game.wordLength)) {
      setLocalError("Ce mot n'est pas dans le dictionnaire.");
      return;
    }

    const attemptNumber = game.attempts.length + 1;
    const solved = guess === game.answer;
    const failed = !solved && attemptNumber >= MAX_ATTEMPTS;
    const attempt: Attempt = {
      id: `chrono-${round}-${attemptNumber}`,
      guess,
      pattern: getPattern(guess, game.answer),
      attemptNumber,
      solved,
      score: solved ? 1 : 0,
      createdAt: new Date().toISOString(),
    };

    setInputValue("");
    setLocalError("");

    if (solved) {
      setWordsSolved((value) => value + 1);
      setCelebrationKey(`chrono-${round}-${attemptNumber}-${Date.now()}`);
      nextWord(round + 1);
      return;
    }

    if (failed) {
      setWordsSkipped((value) => value + 1);
      nextWord(round + 1);
      return;
    }

    setGame((current) => ({
      ...current,
      attempts: [...current.attempts, attempt],
    }));
  }

  return {
    game,
    progress,
    selectedWordLength,
    setSelectedWordLength: (wordLength: WordLengthOption) => {
      setSelectedWordLength(wordLength);
      setInputValue((value) => normalizeGuess(value, wordLength));
    },
    startGame,
    status,
    timeLeft,
    wordsSkipped,
    wordsSolved,
    wordLengthOptions: WORD_LENGTH_OPTIONS,
    skipWord,
    playProps: {
      activeRow,
      canSubmit,
      celebrationKey,
      debugAnswer: game.answer || undefined,
      game,
      inputValue,
      localError,
      pendingGuess: "",
      progress,
      rows,
      solvedAttempt: undefined,
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
