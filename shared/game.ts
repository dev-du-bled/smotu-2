export const WORD_LENGTH = 5;
export const MAX_ATTEMPTS = 6;

export type TileState = "correct" | "present" | "absent";
export type GameMode = "daily" | "endless";
export type EndlessGameStatus = "idle" | "active" | "solved" | "failed";

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

export type GlobalLeaderboardEntry = {
  userId: string;
  userName: string;
  totalScore: number;
  dailyScore: number;
  endlessScore: number;
  gamesSolved: number;
  lastScoredAt: string;
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

export function getScoreForMode(mode: GameMode, attemptNumber: number): number {
  const scores = mode === "daily" ? DAILY_SCORES : ENDLESS_SCORES;
  return scores[attemptNumber - 1] ?? 0;
}
