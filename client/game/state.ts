import {
  MAX_ATTEMPTS,
  WORD_LENGTH,
  type Attempt,
  type EndlessGameState,
  type GameState,
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

export function normalizeGame(
  value: Partial<GameState> | undefined,
): GameState {
  return {
    dateKey: value?.dateKey ?? emptyGame.dateKey,
    attempts: Array.isArray(value?.attempts) ? value.attempts : [],
    maxAttempts:
      typeof value?.maxAttempts === "number"
        ? value.maxAttempts
        : emptyGame.maxAttempts,
    wordLength:
      typeof value?.wordLength === "number"
        ? value.wordLength
        : emptyGame.wordLength,
    solved: Boolean(value?.solved),
    over: Boolean(value?.over),
    answer: value?.answer ?? "",
  };
}

export function normalizeEndlessGame(
  value: Partial<EndlessGameState> | undefined,
): EndlessGameState {
  const game = normalizeGame(value);

  return {
    ...game,
    gameId: value?.gameId ?? emptyEndlessGame.gameId,
    status: value?.status ?? emptyEndlessGame.status,
    gamesPlayed:
      typeof value?.gamesPlayed === "number"
        ? value.gamesPlayed
        : emptyEndlessGame.gamesPlayed,
  };
}

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
