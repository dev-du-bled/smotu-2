import { VALID_WORDS_BY_LENGTH } from "./word-bank";

export const WORD_LENGTH = 5;
export const WORD_LENGTH_OPTIONS = [4, 5, 6, 7, 8] as const;
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
export type EndlessGameStatus =
  | "idle"
  | "active"
  | "solved"
  | "failed"
  | "abandoned";
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
  userImage?: string;
  totalScore: number;
  dailyScore: number;
  endlessScore: number;
  mastermindScore: number;
  dailySolved: number;
  endlessSolved: number;
  mastermindSolved: number;
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
  rank: number | null;
};

export type WordLengthOption = (typeof WORD_LENGTH_OPTIONS)[number];

const VALID_WORD_SETS_BY_LENGTH: Record<WordLengthOption, ReadonlySet<string>> = {
  4: new Set(VALID_WORDS_BY_LENGTH[4]),
  5: new Set(VALID_WORDS_BY_LENGTH[5]),
  6: new Set(VALID_WORDS_BY_LENGTH[6]),
  7: new Set(VALID_WORDS_BY_LENGTH[7]),
  8: new Set(VALID_WORDS_BY_LENGTH[8]),
};

export const WORDS_BY_LENGTH: Record<WordLengthOption, readonly string[]> = {
  4: [
    "AIDE",
    "AILE",
    "AUBE",
    "AVIS",
    "BAIN",
    "BALE",
    "BASE",
    "BEAU",
    "BLOC",
    "BOIS",
    "BORD",
    "BOUT",
    "BRAS",
    "BRUN",
    "CAFE",
    "CAMP",
    "CERF",
    "CHAT",
    "CHEF",
    "CIEL",
    "CLES",
    "COIN",
    "COLS",
    "COUR",
    "DENT",
    "DOUX",
    "DUEL",
    "DUNE",
    "EAUX",
    "ECHO",
    "EPEE",
    "ETUI",
    "FACE",
    "FAIM",
    "FEUX",
    "FILM",
    "FOND",
    "FORT",
    "FOUR",
    "GARE",
    "GOUT",
    "GRIS",
    "IDEE",
    "ILET",
    "JEUX",
    "JOLI",
    "JOUR",
    "LENT",
    "LION",
    "LOIN",
    "MAIN",
    "MARS",
    "MIDI",
    "MIEL",
    "MODE",
    "MONT",
    "MURS",
    "NOIR",
    "NOIX",
    "NORD",
    "NUIT",
    "OURS",
    "PAIN",
    "PARC",
    "PEAU",
    "PIED",
    "PLAN",
    "PONT",
    "PORT",
    "PRIX",
    "RANG",
    "REVE",
    "RIVE",
    "ROBE",
    "ROIS",
    "ROUE",
    "SANG",
    "SEAU",
    "SITE",
    "SOIR",
    "SOIN",
    "SURE",
    "TAXI",
    "TOIT",
    "TOUR",
    "VENT",
    "VERT",
    "VIES",
    "VIFS",
    "VOEU",
  ],
  5: [
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
  ],
  6: [
    "ABRITE",
    "AGENCE",
    "AIGUES",
    "ALARME",
    "AMICAL",
    "ANCIEN",
    "ANIMAL",
    "APPELS",
    "ARCADE",
    "ARGENT",
    "AVENIR",
    "BAGAGE",
    "BALCON",
    "BATEAU",
    "BESOIN",
    "BIJOUX",
    "BILLET",
    "BOUTON",
    "BRIQUE",
    "BUREAU",
    "CABANE",
    "CADEAU",
    "CAMION",
    "CANARD",
    "CARNET",
    "CASQUE",
    "CERCLE",
    "CHALET",
    "CHEMIN",
    "CHIMIE",
    "CINEMA",
    "CITRON",
    "CLIENT",
    "CLOCHE",
    "COLERE",
    "COMPAS",
    "COPAIN",
    "COUPLE",
    "CRAYON",
    "CUISSE",
    "DANGER",
    "DEGATS",
    "DEHORS",
    "DETAIL",
    "DOCILE",
    "DOSAGE",
    "DRAGON",
    "ECLAIR",
    "ECOLES",
    "EFFORT",
    "ENIGME",
    "ESCALE",
    "ESPOIR",
    "ETOILE",
    "FAMINE",
    "FENTES",
    "FIERTE",
    "FLECHE",
    "FLEUVE",
    "FRAISE",
    "GARAGE",
    "GATEAU",
    "GOMMER",
    "GRILLE",
    "GUIDER",
    "HASARD",
    "HEBDOS",
    "HUMEUR",
    "IMAGES",
    "JARDIN",
    "JUNGLE",
    "LAMPES",
    "LANCER",
    "LETTRE",
    "LIVRES",
    "MACHIN",
    "MAISON",
    "MARCHE",
    "MARQUE",
    "MELONS",
    "MIRAGE",
    "MOMENT",
    "MOTEUR",
    "MUSCLE",
    "NATURE",
    "NIVEAU",
    "NUANCE",
    "OBJETS",
    "ORANGE",
    "PAROLE",
    "PARTIE",
    "PATRON",
    "PILOTE",
    "PLANER",
    "PLANTE",
    "POESIE",
    "POLICE",
    "POTEAU",
    "PROJET",
    "PUBLIC",
    "RACINE",
    "RAISON",
    "RECORD",
    "REFLET",
    "REGARD",
    "RESEAU",
    "ROCHER",
    "ROUTES",
    "SALADE",
    "SECRET",
    "SIGNAL",
    "SILICE",
    "SOLEIL",
    "SOMMET",
    "SORBET",
    "SOURCE",
    "SOURIS",
    "STUDIO",
    "TABLES",
    "TENNIS",
    "TICKET",
    "TOMATE",
    "TRAVEE",
    "TUNNEL",
    "VALSES",
    "VALEUR",
    "VELOUR",
    "VERGER",
    "VOYAGE",
  ],
  7: [
    "ABRICOT",
    "ADRESSE",
    "AFFAIRE",
    "AGILITE",
    "AMITIES",
    "ANALYSE",
    "ANCIENS",
    "ARTICLE",
    "ATELIER",
    "AVENIRS",
    "BAGAGES",
    "BALANCE",
    "BARRAGE",
    "BATTEUR",
    "BIBLIOS",
    "BOUCLER",
    "BRILLER",
    "CABINET",
    "CADEAUX",
    "CAMERAS",
    "CAPITAL",
    "CARNETS",
    "CARTONS",
    "CASCADE",
    "CHAISES",
    "CHAMBRE",
    "CHANTER",
    "CHATEAU",
    "CHEMINS",
    "CIRCUIT",
    "CLAVIER",
    "COLLINE",
    "CONSEIL",
    "COURAGE",
    "CUISINE",
    "DESSERT",
    "DIALECT",
    "DOSSIER",
    "ECRITES",
    "ENFANTS",
    "ENERGIE",
    "EXEMPLE",
    "FACTURE",
    "FENETRE",
    "FESTINS",
    "FICHIER",
    "FORMULE",
    "GARCONS",
    "GENERAL",
    "HISTONE",
    "HORIZON",
    "IMAGINE",
    "JARDINS",
    "JOURNAL",
    "LECTURE",
    "LUMIERE",
    "MAGASIN",
    "MAISONS",
    "MARCHER",
    "MELANGE",
    "MEMOIRE",
    "METHODE",
    "MISSION",
    "MOTEURS",
    "MUSIQUE",
    "NOUVEAU",
    "NUMEROS",
    "OISEAUX",
    "ORGANES",
    "OUTILLE",
    "PANIERS",
    "PARADIS",
    "PARFUMS",
    "PARTAGE",
    "PASSAGE",
    "PAYSAGE",
    "PISCINE",
    "PLAFOND",
    "PLAISIR",
    "POISSON",
    "PREMIER",
    "PROBANT",
    "QUARTES",
    "RECETTE",
    "REGARDS",
    "RESEAUX",
    "RIVIERE",
    "ROCHERS",
    "ROULANT",
    "SALADES",
    "SCIENCE",
    "SEANCES",
    "SEMAINE",
    "SERVICE",
    "SILENCE",
    "SOCIETE",
    "SOLDATS",
    "SOURIRE",
    "SOUTIEN",
    "SURFACE",
    "SYSTEME",
    "TABLEAU",
    "TERRAIN",
    "TEXTURE",
    "THEATRE",
    "TRAFICS",
    "TRAVAIL",
    "TRESORS",
    "VILLAGE",
    "VOITURE",
    "VOYAGER",
  ],
  8: [
    "ABANDONS",
    "ABSENCES",
    "ACCIDENT",
    "ADDITION",
    "AEROPORT",
    "AFFICHES",
    "ANIMALES",
    "APPAREIL",
    "ATELIERS",
    "AUTOMATE",
    "BAGUETTE",
    "BATIMENT",
    "BOULANGE",
    "BOUTIQUE",
    "BRANCHES",
    "CALENDES",
    "CAMPAGNE",
    "CAPITALE",
    "CARTABLE",
    "CHAMPION",
    "CHANTIER",
    "CHAPEAUX",
    "CHOCOLAT",
    "CINEASTE",
    "CLAVIERS",
    "COMEDIEN",
    "CONSEILS",
    "COULEURS",
    "COURRIER",
    "CUISINES",
    "DECOUVRE",
    "DESSINER",
    "DISTANCE",
    "DOCUMENT",
    "ECRITURE",
    "ELECTEUR",
    "ENFANCES",
    "ESCALIER",
    "EXEMPLES",
    "EXPLORER",
    "FAMILLES",
    "FESTIVAL",
    "FICHIERS",
    "FONCTION",
    "FORMULES",
    "FROMAGES",
    "GARDIENS",
    "GENERAUX",
    "HABITUDE",
    "HISTOIRE",
    "HORIZONS",
    "IMPRIMER",
    "JARDINER",
    "JOURNAUX",
    "LECTURES",
    "LOGICIEL",
    "MAGASINS",
    "MARCHAND",
    "MATERIEL",
    "MECANISE",
    "MEMOIRES",
    "MONTAGNE",
    "MUSIQUES",
    "NATIONAL",
    "NATURELS",
    "NOUVELLE",
    "OBJECTIF",
    "ORDINALE",
    "OUVRAGES",
    "PANIQUES",
    "PARCOURS",
    "PARTAGER",
    "PASSAGES",
    "PAYSAGES",
    "PEINTURE",
    "PERSONNE",
    "PISCINES",
    "PLAISIRS",
    "POISSONS",
    "PREMIERS",
    "PROBLEME",
    "QUESTION",
    "RACONTES",
    "RECETTES",
    "REGARDER",
    "RESERVES",
    "RIVIERES",
    "SALAIRES",
    "SCIENCES",
    "SEMAINES",
    "SERVICES",
    "SILENCES",
    "SOCIETES",
    "SOUVENIR",
    "TABLEAUX",
    "TELEPORT",
    "TERRAINS",
    "TEXTURES",
    "THEATRES",
    "TRAVAILS",
    "VACANCES",
    "VILLAGES",
    "VOITURES",
    "VOYAGEUR",
  ],
} as const;

export const WORDS = WORDS_BY_LENGTH[WORD_LENGTH];

const DAILY_SCORES = [900, 750, 600, 450, 300, 150] as const;
const ENDLESS_SCORES_BY_LENGTH: Record<WordLengthOption, readonly number[]> = {
  4: [280, 230, 180, 130, 80, 40],
  5: [350, 290, 230, 170, 110, 50],
  6: [420, 350, 280, 210, 140, 70],
  7: [490, 410, 330, 250, 170, 90],
  8: [560, 470, 380, 290, 200, 100],
} as const;
const MASTERMIND_SCORES = [560, 500, 440, 380, 320, 260, 200, 140] as const;

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function isWordLengthOption(value: number): value is WordLengthOption {
  return WORD_LENGTH_OPTIONS.includes(value as WordLengthOption);
}

export function normalizeWordLength(value: unknown): WordLengthOption {
  const parsed = Number(value);
  return isWordLengthOption(parsed) ? parsed : WORD_LENGTH;
}

export function wordsForLength(wordLength: number): readonly string[] {
  return isWordLengthOption(wordLength) ? WORDS_BY_LENGTH[wordLength] : WORDS;
}

export function validWordsForLength(wordLength: number): readonly string[] {
  return isWordLengthOption(wordLength) ? VALID_WORDS_BY_LENGTH[wordLength] : VALID_WORDS_BY_LENGTH[WORD_LENGTH];
}

export function randomWord(wordLength = WORD_LENGTH): string {
  const words = wordsForLength(wordLength);
  return words[Math.floor(Math.random() * words.length)];
}

export function isKnownWord(value: string, wordLength = WORD_LENGTH): boolean {
  const guess = normalizeGuess(value, wordLength);
  return isWordLengthOption(wordLength) && VALID_WORD_SETS_BY_LENGTH[wordLength].has(guess);
}

export function normalizeGuess(value: string, wordLength = WORD_LENGTH): string {
  return value
    .replace(/[œŒ]/g, "oe")
    .replace(/[æÆ]/g, "ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, wordLength);
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
  const wordLength = answerValue.length || WORD_LENGTH;
  const guess = normalizeGuess(guessValue, wordLength);
  const answer = normalizeGuess(answerValue, wordLength);
  const pattern: TileState[] = Array.from({ length: wordLength }, () => "absent");
  const remaining = new Map<string, number>();

  for (let index = 0; index < wordLength; index += 1) {
    const guessLetter = guess[index];
    const answerLetter = answer[index];

    if (guessLetter === answerLetter) {
      pattern[index] = "correct";
    } else if (answerLetter) {
      remaining.set(answerLetter, (remaining.get(answerLetter) ?? 0) + 1);
    }
  }

  for (let index = 0; index < wordLength; index += 1) {
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

// Dévalorisation à la perte du mode libre : perdre (ou abandonner) une manche coûte
// plus cher que le meilleur gain possible pour la même longueur. Sans ça, on pouvait
// farmer des smotucoins en spammant des manches et n'en gagner qu'une sur dix.
const ENDLESS_LOSS_PENALTY_BY_LENGTH: Record<WordLengthOption, number> = {
  4: 300,
  5: 375,
  6: 450,
  7: 525,
  8: 600,
} as const;

export function getEndlessScore(attemptNumber: number, wordLength = WORD_LENGTH): number {
  const scores = ENDLESS_SCORES_BY_LENGTH[normalizeWordLength(wordLength)];
  return scores[attemptNumber - 1] ?? 0;
}

export function getEndlessLossPenalty(wordLength = WORD_LENGTH): number {
  return ENDLESS_LOSS_PENALTY_BY_LENGTH[normalizeWordLength(wordLength)];
}

export function getScoreForMode(
  mode: GameMode,
  attemptNumber: number,
  wordLength = WORD_LENGTH,
): number {
  if (mode === "endless") {
    return getEndlessScore(attemptNumber, wordLength);
  }

  const scores = {
    daily: DAILY_SCORES,
    mastermind: MASTERMIND_SCORES,
  }[mode];

  return scores[attemptNumber - 1] ?? 0;
}
