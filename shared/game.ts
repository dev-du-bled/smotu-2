export const WORD_LENGTH = 5;
export const MAX_ATTEMPTS = 6;

export const WORDS = [
  "ARBRE",
  "BRUME",
  "CHAIR",
  "DANSE",
  "ECLAT",
  "FABLE",
  "GIVRE",
  "HAVRE",
  "IMAGE",
  "JOUET",
  "LAMPE",
  "MAGIE",
  "NEIGE",
  "OMBRE",
  "PLAGE",
  "QUART",
  "ROUTE",
  "SUCRE",
  "TIGRE",
  "USINE",
  "VAGUE",
  "WAGON",
  "ZESTE",
  "AIGLE",
  "BALLE",
  "CARTE",
  "DOUCE",
  "ELANS",
  "FLEUR",
  "GRACE",
  "HERBE",
  "IDEAL",
  "JAUNE",
  "KOALA",
  "LIVRE",
  "MONDE",
  "NUAGE",
  "OCEAN",
  "PIANO",
  "RAYON",
  "SABLE",
  "TERRE",
  "UNION",
  "VITRE",
  "YACHT",
  "ZEBRE",
];

export type TileState = "correct" | "present" | "absent";

export type Attempt = {
  id: string;
  guess: string;
  pattern: TileState[];
  attemptNumber: number;
  solved: boolean;
  score: number;
  createdAt: string;
};

export type LeaderboardEntry = {
  userId: string;
  userName: string;
  score: number;
  attempts: number;
  createdAt: string;
};

export type GameState = {
  dateKey: string;
  attempts: Attempt[];
  maxAttempts: number;
  wordLength: number;
  solved: boolean;
  over: boolean;
  answer: string;
};

export function normalizeGuess(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, WORD_LENGTH);
}

export function getWordForDate(dateKey: string): string {
  let hash = 0;
  for (let index = 0; index < dateKey.length; index += 1) {
    hash = (hash * 31 + dateKey.charCodeAt(index)) % 100000;
  }
  return WORDS[hash % WORDS.length];
}

export function getPattern(guess: string, answer: string): TileState[] {
  const result: TileState[] = Array(WORD_LENGTH).fill("absent");
  const remaining: Record<string, number> = {};

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (guess[index] === answer[index]) {
      result[index] = "correct";
    } else {
      const letter = answer[index];
      remaining[letter] = (remaining[letter] ?? 0) + 1;
    }
  }

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (result[index] === "correct") {
      continue;
    }

    const letter = guess[index];
    if ((remaining[letter] ?? 0) > 0) {
      result[index] = "present";
      remaining[letter] -= 1;
    }
  }

  return result;
}

export function getScore(attemptNumber: number): number {
  return Math.max(1, MAX_ATTEMPTS - attemptNumber + 1) * 100;
}
