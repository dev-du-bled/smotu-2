import {
  MAX_ATTEMPTS,
  WORD_LENGTH,
  type Attempt,
  type EndlessGameState,
  type GameState,
  type GlobalLeaderboardEntry,
  type TileState,
} from "../../shared/game";

export const emptyGame: GameState = {
  dateKey: "",
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
