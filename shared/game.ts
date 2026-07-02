export const WORD_LENGTH = 5;
export const MAX_ATTEMPTS = 6;
export const MASTERMIND_CODE_LENGTH = 4;
export const MASTERMIND_MAX_ATTEMPTS = 8;

export const MASTERMIND_COLORS = [
  { id: "R", name: "Rouge", hex: "#ef4444" },
  { id: "B", name: "Bleu", hex: "#3b82f6" },
  { id: "G", name: "Vert", hex: "#22c55e" },
  { id: "Y", name: "Jaune", hex: "#eab308" },
  { id: "P", name: "Violet", hex: "#a855f7" },
  { id: "O", name: "Orange", hex: "#f97316" },
] as const;

export type MastermindColorId = (typeof MASTERMIND_COLORS)[number]["id"];

export type TileState = "correct" | "present" | "absent";
export type GameMode = "daily" | "endless" | "mastermind";
export type EndlessGameStatus = "idle" | "active" | "solved" | "failed";
export type MastermindGameStatus = EndlessGameStatus;

export type Attempt = {
  id: string;
  guess: string;
  pattern: TileState[];
  attemptNumber: number;
  solved: boolean;
  score: number;
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

export type EndlessGameState = GameState & {
  gameId: string;
  status: EndlessGameStatus;
  gamesPlayed: number;
};

export type MastermindAttempt = {
  id: string;
  guess: MastermindColorId[];
  exact: number;
  present: number;
  attemptNumber: number;
  solved: boolean;
  score: number;
  createdAt: string;
};

export type MastermindGameState = {
  gameId: string;
  attempts: MastermindAttempt[];
  maxAttempts: number;
  codeLength: number;
  solved: boolean;
  over: boolean;
  answer: MastermindColorId[];
  status: MastermindGameStatus;
  gamesPlayed: number;
};

export type GlobalLeaderboardEntry = {
  userId: string;
  userName: string;
  totalScore: number;
  dailyScore: number;
  endlessScore: number;
  mastermindScore: number;
  gamesSolved: number;
  lastScoredAt: string;
};

export type LeaderboardSet = {
  global: GlobalLeaderboardEntry[];
  daily: GlobalLeaderboardEntry[];
  endless: GlobalLeaderboardEntry[];
  mastermind: GlobalLeaderboardEntry[];
};

export type ProfileStats = GlobalLeaderboardEntry & {
  dailySolved: number;
  endlessSolved: number;
  mastermindSolved: number;
  rank: number | null;
};

export const WORDS = [
  "ABORD",
  "ACIER",
  "ADORE",
  "AGILE",
  "AIMER",
  "ALBUM",
  "AMBRE",
  "ANGLE",
  "ARBRE",
  "AVION",
  "BADGE",
  "BALAI",
  "BANAL",
  "BANJO",
  "BARON",
  "BASIC",
  "BILAN",
  "BLANC",
  "BLOCS",
  "BONUS",
  "BRAVE",
  "BRUIT",
  "BUCHE",
  "CABLE",
  "CACHE",
  "CALME",
  "CANAL",
  "CARTE",
  "CHAIR",
  "CHANT",
  "CHOIX",
  "CIBLE",
  "CLAIR",
  "CLAVU",
  "COEUR",
  "COMTE",
  "CORPS",
  "CRANE",
  "CYCLE",
  "DANSE",
  "DECOR",
  "DELTA",
  "DINER",
  "DOUTE",
  "DRAME",
  "DROIT",
  "ECLAT",
  "ECRAN",
  "ELITE",
  "EMAIL",
  "ENCRE",
  "ENFER",
  "ESSAI",
  "ETAGE",
  "ETOLE",
  "FABLE",
  "FACON",
  "FAIRE",
  "FARCE",
  "FIBRE",
  "FLEUR",
  "FLOUS",
  "FORGE",
  "FRAIS",
  "FRONT",
  "GAMIN",
  "GARDE",
  "GENRE",
  "GLACE",
  "GRAIN",
  "GRAND",
  "GRAVE",
  "HABIT",
  "HEROS",
  "HIVER",
  "IMAGE",
  "INDEX",
  "JANTE",
  "JAUNE",
  "JETON",
  "JOUER",
  "LARGE",
  "LASER",
  "LIGNE",
  "LOCAL",
  "LOGER",
  "MAGIE",
  "MAINS",
  "MAJOR",
  "MARIN",
  "MATCH",
  "METRO",
  "MICRO",
  "MONDE",
  "MOTIF",
  "MOTUS",
  "NACRE",
  "NEIGE",
  "NIVEA",
  "NOBLE",
  "OASIS",
  "OCEAN",
  "OMBRE",
  "ORBIT",
  "ORDRE",
  "PANEL",
  "PARIS",
  "PAUSE",
  "PIXEL",
  "PLAGE",
  "PLUIE",
  "PORTE",
  "PROSE",
  "RADAR",
  "RAYON",
  "REACT",
  "ROBOT",
  "ROUGE",
  "ROUTE",
  "ROYAL",
  "SABLE",
  "SALON",
  "SCORE",
  "SERVI",
  "SMOTU",
  "SOLDE",
  "SONAR",
  "SOUPE",
  "STYLE",
  "TABLE",
  "TANGO",
  "TEMPO",
  "TEXTE",
  "TIGRE",
  "TRACE",
  "TRAME",
  "UNION",
  "USAGE",
  "VAGUE",
  "VALSE",
  "VASTE",
  "VENIR",
  "VERRE",
  "VIDEO",
  "VIRAL",
  "VITES",
  "VOTRE",
  "WAGON",
  "ZEBRE",
] as const;

const DAILY_SCORES = [900, 750, 600, 450, 300, 150] as const;
const ENDLESS_SCORES = [360, 300, 240, 180, 120, 60] as const;
const MASTERMIND_SCORES = [560, 500, 440, 380, 320, 260, 200, 140] as const;

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function normalizeGuess(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, WORD_LENGTH);
}

export function isMastermindColorId(value: string): value is MastermindColorId {
  return MASTERMIND_COLORS.some((color) => color.id === value);
}

export function normalizeMastermindGuess(value: unknown): MastermindColorId[] {
  const raw = Array.isArray(value) ? value : String(value).split("");

  return raw
    .map((item) => String(item).toUpperCase())
    .filter(isMastermindColorId)
    .slice(0, MASTERMIND_CODE_LENGTH);
}

export function getWordForDate(dateKey: string): string {
  return WORDS[hashString(dateKey) % WORDS.length];
}

export function getPattern(guessValue: string, answerValue: string): TileState[] {
  const guess = normalizeGuess(guessValue);
  const answer = normalizeGuess(answerValue);
  const pattern: TileState[] = Array.from({ length: WORD_LENGTH }, () => "absent");
  const remaining = new Map<string, number>();

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    const guessLetter = guess[index];
    const answerLetter = answer[index];

    if (guessLetter === answerLetter) {
      pattern[index] = "correct";
    } else if (answerLetter) {
      remaining.set(answerLetter, (remaining.get(answerLetter) ?? 0) + 1);
    }
  }

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (pattern[index] === "correct") {
      continue;
    }

    const letter = guess[index];
    const count = remaining.get(letter) ?? 0;

    if (count > 0) {
      pattern[index] = "present";
      remaining.set(letter, count - 1);
    }
  }

  return pattern;
}

export function getMastermindFeedback(
  guessValue: readonly MastermindColorId[],
  answerValue: readonly MastermindColorId[],
): { exact: number; present: number } {
  let exact = 0;
  let present = 0;
  const remainingAnswer = new Map<MastermindColorId, number>();
  const remainingGuess: MastermindColorId[] = [];

  for (let index = 0; index < MASTERMIND_CODE_LENGTH; index += 1) {
    const guess = guessValue[index];
    const answer = answerValue[index];

    if (guess && answer && guess === answer) {
      exact += 1;
      continue;
    }

    if (answer) {
      remainingAnswer.set(answer, (remainingAnswer.get(answer) ?? 0) + 1);
    }
    if (guess) {
      remainingGuess.push(guess);
    }
  }

  for (const color of remainingGuess) {
    const count = remainingAnswer.get(color) ?? 0;
    if (count > 0) {
      present += 1;
      remainingAnswer.set(color, count - 1);
    }
  }

  return { exact, present };
}

export function getScoreForMode(mode: GameMode, attemptNumber: number): number {
  const scores = {
    daily: DAILY_SCORES,
    endless: ENDLESS_SCORES,
    mastermind: MASTERMIND_SCORES,
  }[mode];

  return scores[attemptNumber - 1] ?? 0;
}
