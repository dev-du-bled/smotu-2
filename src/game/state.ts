import {
  MASTERMIND_CODE_LENGTH,
  MASTERMIND_MAX_ATTEMPTS,
  MAX_ATTEMPTS,
  WORD_LENGTH,
  type Attempt,
  type EndlessGameState,
  type GameState,
  type GlobalLeaderboardEntry,
  type LeaderboardSet,
  type MastermindGameState,
  type TileState,
} from "../../shared/game";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export const emptyGame: GameState = {
  dateKey: todayKey(),
  attempts: [],
  maxAttempts: MAX_ATTEMPTS,
  wordLength: WORD_LENGTH,
  solved: false,
  over: false,
  answer: "",
};

export const emptyEndlessGame: EndlessGameState = {
  ...emptyGame,
  gameId: "",
  status: "idle",
  gamesPlayed: 0,
  over: true,
};

export const emptyLeaderboard: GlobalLeaderboardEntry[] = [];

export const emptyLeaderboards: LeaderboardSet = {
  global: [],
  daily: [],
  endless: [],
  mastermind: [],
};

export const emptyMastermindGame: MastermindGameState = {
  gameId: "",
  attempts: [],
  maxAttempts: MASTERMIND_MAX_ATTEMPTS,
  codeLength: MASTERMIND_CODE_LENGTH,
  solved: false,
  over: true,
  answer: [],
  status: "idle",
  gamesPlayed: 0,
};

export function letterStates(attempts: Attempt[]): Record<string, TileState> {
  const priority: Record<TileState, number> = {
    absent: 1,
    present: 2,
    correct: 3,
  };
  const states: Record<string, TileState> = {};

  for (const attempt of attempts) {
    attempt.guess.split("").forEach((letter, index) => {
      const next = attempt.pattern[index];
      const current = states[letter];
      if (!current || priority[next] > priority[current]) {
        states[letter] = next;
      }
    });
  }

  return states;
}
