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

export type ShopCategory =
  | "avatar"
  | "hat"
  | "shirt"
  | "confetti"
  | "theme"
  | "hint";
export type ShopEquipSlot = Exclude<ShopCategory, "hint">;
export type ShopRarity = "common" | "rare" | "epic" | "legendary";
export type ShopItemId =
  | "avatar-classic-3d"
  | "avatar-renard"
  | "avatar-hibou"
  | "avatar-dragon"
  | "avatar-robot"
  | "avatar-astronaute"
  | "avatar-slime"
  | "avatar-abeille"
  | "avatar-fantome"
  | "avatar-yeti"
  | "avatar-panda"
  | "avatar-citrouille"
  | "avatar-grenouille"
  | "avatar-requin"
  | "avatar-tigre"
  | "avatar-licorne"
  | "hat-casquette"
  | "hat-couronne-lowpoly"
  | "hat-casque-spatial"
  | "hat-bonnet-pixel"
  | "hat-halo"
  | "hat-sorcier"
  | "hat-viking"
  | "hat-melon"
  | "hat-pirate"
  | "hat-cowboy"
  | "hat-noel"
  | "hat-ninja"
  | "hat-beret"
  | "hat-detective"
  | "shirt-classic"
  | "shirt-neon"
  | "shirt-mastermind"
  | "shirt-champion"
  | "shirt-volcan"
  | "shirt-pixel"
  | "shirt-arcenciel"
  | "shirt-menthe"
  | "shirt-galaxie"
  | "shirt-marin"
  | "shirt-cyber"
  | "shirt-ninja"
  | "shirt-detective"
  | "shirt-lave"
  | "theme-default"
  | "theme-neon"
  | "theme-foret"
  | "theme-ocean"
  | "theme-sakura"
  | "theme-minuit"
  | "theme-auto"
  | "theme-volcan"
  | "theme-obsidienne"
  | "theme-arctique"
  | "theme-royal"
  | "theme-crepuscule"
  | "theme-desert"
  | "theme-abysse"
  | "confetti-classic"
  | "confetti-etoiles"
  | "confetti-smotucoins"
  | "confetti-feux-artifice"
  | "confetti-galaxie"
  | "confetti-pluie-or"
  | "confetti-neige"
  | "confetti-bulles"
  | "confetti-lave"
  | "confetti-emeraude"
  | "confetti-or-rose"
  | "confetti-rubis"
  | "confetti-citrons"
  | "confetti-cosmos"
  | "hint-letter-pack"
  | "hint-position-pack"
  | "hint-mastermind-pack";

export type ShopEquipment = Partial<Record<ShopEquipSlot, ShopItemId>>;

export type PublicAvatar = {
  avatarId: ShopItemId;
  hatId?: ShopItemId;
  shirtId: ShopItemId;
  confettiId: ShopItemId;
  themeId: ShopItemId;
};

export const DEFAULT_SHOP_EQUIPMENT: Required<ShopEquipment> = {
  avatar: "avatar-classic-3d",
  hat: "hat-casquette",
  shirt: "shirt-classic",
  confetti: "confetti-classic",
  theme: "theme-default",
};

export const DEFAULT_PUBLIC_AVATAR: PublicAvatar = {
  avatarId: DEFAULT_SHOP_EQUIPMENT.avatar,
  hatId: undefined,
  shirtId: DEFAULT_SHOP_EQUIPMENT.shirt,
  confettiId: DEFAULT_SHOP_EQUIPMENT.confetti,
  themeId: DEFAULT_SHOP_EQUIPMENT.theme,
};

export type GlobalLeaderboardEntry = {
  userId: string;
  userName: string;
  publicAvatar: PublicAvatar;
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

export type ProfileRecentGame = {
  id: string;
  mode: GameMode;
  status: AdminGameStatus;
  score: number;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ProfileInventorySummary = {
  balance: number;
  equipped: ShopEquipment;
  ownedCount: number;
  ownedThemeIds: ShopItemId[];
  totalItems: number;
  consumables: ShopInventory["consumables"];
  publicAvatar: PublicAvatar;
};

export type ProfileStats = GlobalLeaderboardEntry & {
  inventory: ProfileInventorySummary;
  rank: number | null;
  recentGames: ProfileRecentGame[];
};

export type FriendshipStatus =
  | "self"
  | "friend"
  | "incoming"
  | "outgoing"
  | "none";

export type PlayerSearchResult = FriendProfile & {
  totalScore: number;
  rank: number | null;
  gamesSolved: number;
  friendshipStatus: FriendshipStatus;
};

export type PublicPlayerProfile = ProfileStats & {
  friendshipStatus: FriendshipStatus;
};

export type AdminGameStatus =
  | "solved"
  | "failed"
  | "abandoned"
  | "active";

// Vue admin d'une partie jouée par un utilisateur : le mot (ou code) à trouver,
// les coups, la durée et les smotucoins gagnés/perdus. Les coups gardent leur
// forme d'origine (`Attempt` pour les mots, `MastermindAttempt` pour le code).
export type AdminUserGame = {
  id: string;
  mode: GameMode;
  answer: string;
  answerColors?: MastermindColorId[];
  status: AdminGameStatus;
  solved: boolean;
  score: number;
  attemptCount: number;
  maxAttempts: number;
  durationMs: number;
  createdAt: string;
  updatedAt: string;
  attempts: Attempt[];
  mastermindAttempts?: MastermindAttempt[];
};

export type AdminUserGamesData = {
  userId: string | null;
  games: AdminUserGame[];
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
    "ABRI",
    "ACRE",
    "ACTE",
    "AFIN",
    "AIDE",
    "AIGU",
    "AILE",
    "AIRE",
    "AISE",
    "ALTO",
    "AMAS",
    "AMIE",
    "ANGE",
    "ANIS",
    "ANSE",
    "APTE",
    "ARDU",
    "ARME",
    "ARTS",
    "AUBE",
    "AVIS",
    "AZUR",
    "BAIN",
    "BALE",
    "BANC",
    "BARD",
    "BASE",
    "BEAU",
    "BEBE",
    "BILE",
    "BISE",
    "BLEU",
    "BLOC",
    "BOIS",
    "BOLS",
    "BOND",
    "BORD",
    "BOUT",
    "BRAS",
    "BREF",
    "BRIN",
    "BRUN",
    "CAFE",
    "CAMP",
    "CAVE",
    "CERF",
    "CHAR",
    "CHAT",
    "CHEF",
    "CHOU",
    "CIEL",
    "CLES",
    "CLOU",
    "CODE",
    "COIN",
    "COLS",
    "COUR",
    "CRIS",
    "CUIR",
    "DAME",
    "DATE",
    "DENT",
    "DEUX",
    "DIEU",
    "DOSE",
    "DOUX",
    "DUEL",
    "DUNE",
    "EAUX",
    "ECHO",
    "EPEE",
    "ETUI",
    "FACE",
    "FAIM",
    "FEES",
    "FEUX",
    "FEVE",
    "FILM",
    "FOIE",
    "FOND",
    "FORT",
    "FOUR",
    "GANT",
    "GARE",
    "GENS",
    "GOUT",
    "GRIS",
    "HUIT",
    "IDEE",
    "ILET",
    "JEUX",
    "JOLI",
    "JOUR",
    "JUPE",
    "LAIT",
    "LAME",
    "LENT",
    "LION",
    "LOIN",
    "LOUP",
    "LUNE",
    "MAIN",
    "MARS",
    "MERS",
    "MIDI",
    "MIEL",
    "MODE",
    "MOIS",
    "MONT",
    "MOTS",
    "MURS",
    "MUSE",
    "NAGE",
    "NEUF",
    "NOIR",
    "NOIX",
    "NORD",
    "NOTE",
    "NUIT",
    "ONZE",
    "OURS",
    "PAGE",
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
    "SOIN",
    "SOIR",
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
    "ABRIS",
    "ACIDE",
    "ACIER",
    "ACTES",
    "ADIEU",
    "ADORE",
    "AGENT",
    "AGILE",
    "AIGLE",
    "AIMER",
    "ALBUM",
    "ALLEE",
    "ALOES",
    "AMBRE",
    "AMOUR",
    "ANGLE",
    "ANNEE",
    "APPUI",
    "ARBRE",
    "ARCHE",
    "ARENE",
    "ARGON",
    "ARIDE",
    "ARMEE",
    "ARRET",
    "ATLAS",
    "ATOUT",
    "AVALS",
    "AVANT",
    "AVION",
    "AVOIR",
    "AZOTE",
    "BADGE",
    "BAGUE",
    "BALAI",
    "BANAL",
    "BANDE",
    "BANJO",
    "BARBE",
    "BARON",
    "BASIC",
    "BATON",
    "BILAN",
    "BLANC",
    "BLOCS",
    "BOITE",
    "BONUS",
    "BRAVE",
    "BRISE",
    "BRUIT",
    "BUCHE",
    "CABLE",
    "CACHE",
    "CADRE",
    "CALME",
    "CANAL",
    "CARTE",
    "CHAIR",
    "CHANT",
    "CHIEN",
    "CHOIX",
    "CHUTE",
    "CIBLE",
    "CLAIR",
    "CLOWN",
    "COEUR",
    "COMTE",
    "CORPS",
    "COTON",
    "CRANE",
    "CROIX",
    "CYCLE",
    "DANSE",
    "DEBUT",
    "DECOR",
    "DELTA",
    "DINER",
    "DOUTE",
    "DRAME",
    "DROIT",
    "DROLE",
    "ECLAT",
    "ECOLE",
    "ECRAN",
    "ELEVE",
    "ELITE",
    "EMAIL",
    "ENCRE",
    "ENFER",
    "EPICE",
    "ESSAI",
    "ETAGE",
    "ETUDE",
    "FABLE",
    "FACON",
    "FAIRE",
    "FARCE",
    "FERME",
    "FIBRE",
    "FLEUR",
    "FLOUS",
    "FLUTE",
    "FORGE",
    "FRAIS",
    "FRONT",
    "FRUIT",
    "FUMEE",
    "GAMIN",
    "GARDE",
    "GENIE",
    "GENRE",
    "GESTE",
    "GLACE",
    "GRAIN",
    "GRAND",
    "GRAVE",
    "HABIT",
    "HERBE",
    "HEROS",
    "HIVER",
    "HOTEL",
    "IMAGE",
    "INDEX",
    "JANTE",
    "JAUNE",
    "JETON",
    "JOUER",
    "LARGE",
    "LASER",
    "LIGNE",
    "LIVRE",
    "LOCAL",
    "LOGER",
    "LUTTE",
    "MAGIE",
    "MAINS",
    "MAJOR",
    "MARIN",
    "MATCH",
    "MERCI",
    "METAL",
    "METRO",
    "MICRO",
    "MONDE",
    "MOTIF",
    "MOTUS",
    "NACRE",
    "NEIGE",
    "NOBLE",
    "NUAGE",
    "OASIS",
    "OCEAN",
    "OLIVE",
    "OMBRE",
    "ONGLE",
    "ORBIT",
    "ORDRE",
    "PANEL",
    "PARIS",
    "PAUSE",
    "PECHE",
    "PERLE",
    "PIXEL",
    "PLAGE",
    "PLUIE",
    "POIRE",
    "POMME",
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
    "ABAQUE",
    "ABBAYE",
    "ABJECT",
    "ABRITE",
    "ABRUPT",
    "ABSENT",
    "ABSIDE",
    "ABSOLU",
    "ABUSIF",
    "ABYSSE",
    "ACACIA",
    "ACAJOU",
    "ACCENT",
    "ACCORD",
    "ACCROC",
    "ACERBE",
    "ACTEUR",
    "ADIEUX",
    "AFFLUX",
    "AGENCE",
    "AGENDA",
    "AIGLES",
    "AIGUES",
    "ALARME",
    "ALCOVE",
    "ALERTE",
    "AMANDE",
    "AMICAL",
    "ANANAS",
    "ANCIEN",
    "ANIMAL",
    "APPELS",
    "ARCADE",
    "ARGENT",
    "ARGILE",
    "AUTEUR",
    "AVENIR",
    "AVENUE",
    "BAGAGE",
    "BALCON",
    "BALLON",
    "BANANE",
    "BATEAU",
    "BESOIN",
    "BEURRE",
    "BIJOUX",
    "BILLET",
    "BOUCLE",
    "BOUGIE",
    "BOUTON",
    "BRIQUE",
    "BUREAU",
    "CABANE",
    "CADEAU",
    "CAMERA",
    "CAMION",
    "CANARD",
    "CARAFE",
    "CARNET",
    "CARTON",
    "CASQUE",
    "CERCLE",
    "CERISE",
    "CHAINE",
    "CHALET",
    "CHANCE",
    "CHEMIN",
    "CHEVAL",
    "CHIMIE",
    "CINEMA",
    "CITRON",
    "CLIENT",
    "CLOCHE",
    "COLERE",
    "COMBAT",
    "COMPAS",
    "COPAIN",
    "CORDES",
    "COUDRE",
    "COUPLE",
    "CRAYON",
    "CREDIT",
    "CROUTE",
    "CUISSE",
    "DANGER",
    "DEBOUT",
    "DEGATS",
    "DEGOUT",
    "DEHORS",
    "DETAIL",
    "DOCILE",
    "DOSAGE",
    "DRAGON",
    "ECLAIR",
    "ECOLES",
    "EFFORT",
    "ENIGME",
    "EPAULE",
    "ESCALE",
    "ESPOIR",
    "ETOILE",
    "FACADE",
    "FAMINE",
    "FENTES",
    "FIERTE",
    "FLACON",
    "FLECHE",
    "FLEUVE",
    "FRAISE",
    "GARAGE",
    "GATEAU",
    "GLACON",
    "GOMMER",
    "GRAINE",
    "GRILLE",
    "GROTTE",
    "GUIDER",
    "HASARD",
    "HEBDOS",
    "HUMEUR",
    "IMAGES",
    "INDICE",
    "JARDIN",
    "JOUEUR",
    "JUNGLE",
    "LAMPES",
    "LANCER",
    "LEGUME",
    "LETTRE",
    "LIMITE",
    "LIVRES",
    "MACHIN",
    "MAISON",
    "MANCHE",
    "MANGUE",
    "MARCHE",
    "MARQUE",
    "MELONS",
    "MIRAGE",
    "MIROIR",
    "MODELE",
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
    "VALEUR",
    "VALSES",
    "VELOUR",
    "VERGER",
    "VOYAGE",
  ],
  7: [
    "ABANDON",
    "ABDOMEN",
    "ABEILLE",
    "ABRICOT",
    "ABSENCE",
    "ACCENTS",
    "ACCUEIL",
    "ACHETER",
    "ADAPTER",
    "ADMIRER",
    "ADRESSE",
    "AFFAIRE",
    "AGENCES",
    "AGILITE",
    "AGRUMES",
    "ALBATRE",
    "AMITIES",
    "AMPOULE",
    "ANALYSE",
    "ANCIENS",
    "ANIMAUX",
    "ANTENNE",
    "APPUYER",
    "ARCHIVE",
    "ARTICLE",
    "ARTISAN",
    "ATELIER",
    "ATTACHE",
    "AVENIRS",
    "AVOCATS",
    "BAGAGES",
    "BAGNOLE",
    "BALANCE",
    "BALCONS",
    "BAROQUE",
    "BARRAGE",
    "BATEAUX",
    "BATTEUR",
    "BIBLIOS",
    "BOUCHER",
    "BOUCLER",
    "BOUQUET",
    "BOUQUIN",
    "BOUTONS",
    "BRILLER",
    "CABANON",
    "CABINET",
    "CADEAUX",
    "CADENCE",
    "CALCULE",
    "CAMERAS",
    "CAMPING",
    "CAPITAL",
    "CAPTURE",
    "CARNETS",
    "CARTONS",
    "CASCADE",
    "CHAISES",
    "CHALEUR",
    "CHAMBRE",
    "CHANTER",
    "CHAPEAU",
    "CHARBON",
    "CHATEAU",
    "CHEMINS",
    "CHEVEUX",
    "CIRCUIT",
    "CLASSER",
    "CLAVIER",
    "COLLINE",
    "COMPLET",
    "CONCERT",
    "CONDUIT",
    "CONSEIL",
    "COURAGE",
    "COUTEAU",
    "CUISINE",
    "CULTURE",
    "DESSERT",
    "DIALECT",
    "DIPLOME",
    "DOSSIER",
    "DRAPEAU",
    "ECHELLE",
    "ECRITES",
    "ELEGANT",
    "ENERGIE",
    "ENFANTS",
    "EPINARD",
    "ETRANGE",
    "EXEMPLE",
    "FACTURE",
    "FALAISE",
    "FANFARE",
    "FENETRE",
    "FERMIER",
    "FESTINS",
    "FICELLE",
    "FICHIER",
    "FORMULE",
    "GALERIE",
    "GARCONS",
    "GENERAL",
    "GRENIER",
    "HISTONE",
    "HORIZON",
    "IMAGINE",
    "IMPASSE",
    "JARDINS",
    "JOURNAL",
    "JOURNEE",
    "LECTURE",
    "LUMIERE",
    "MACHINE",
    "MAGASIN",
    "MAISONS",
    "MANTEAU",
    "MARCHER",
    "MARQUER",
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
    "ABDOMENS",
    "ABEILLES",
    "ABRICOTS",
    "ABSENCES",
    "ABSOLUES",
    "ABSTRAIT",
    "ACCIDENT",
    "ACCUEILS",
    "ACHETEES",
    "ADDITION",
    "AEROPORT",
    "AFFICHES",
    "AGRICOLE",
    "AIGUILLE",
    "ALBATROS",
    "AMBIANCE",
    "AMPOULES",
    "ANCIENNE",
    "ANIMALES",
    "ANTENNES",
    "APERITIF",
    "APPAREIL",
    "ARCHIVES",
    "ARROSAGE",
    "ARTISANS",
    "ATELIERS",
    "AUTOMATE",
    "AVENTURE",
    "BAGNOLES",
    "BAGUETTE",
    "BALEINES",
    "BATAILLE",
    "BATELIER",
    "BATIMENT",
    "BERCEAUX",
    "BETONNER",
    "BIENFAIT",
    "BIJECTIF",
    "BOUCLIER",
    "BOULANGE",
    "BOUQUETS",
    "BOUTIQUE",
    "BRANCHES",
    "BRAVOURE",
    "BROCHURE",
    "BROUETTE",
    "CABANONS",
    "CADENCES",
    "CALENDES",
    "CAMPAGNE",
    "CAPITALE",
    "CARTABLE",
    "CASCADES",
    "CEINTURE",
    "CHAMPION",
    "CHANTIER",
    "CHAPEAUX",
    "CHAPELLE",
    "CHARIOTS",
    "CHOCOLAT",
    "CINEASTE",
    "CLAVIERS",
    "COLLIERS",
    "COMEDIEN",
    "CONCERTS",
    "CONSEILS",
    "COULEURS",
    "COURRIER",
    "COUTEAUX",
    "CROISADE",
    "CUISINES",
    "CYLINDRE",
    "DECHARGE",
    "DECOUVRE",
    "DESSINER",
    "DIPLOMES",
    "DISTANCE",
    "DOCUMENT",
    "DRAPEAUX",
    "ECRITURE",
    "ELECTEUR",
    "EMPEREUR",
    "ENCLUMES",
    "ENFANCES",
    "ESCALIER",
    "EXEMPLES",
    "EXPLORER",
    "FALAISES",
    "FAMILLES",
    "FANFARES",
    "FERMIERS",
    "FESTIVAL",
    "FICHIERS",
    "FONCTION",
    "FONTAINE",
    "FORMULES",
    "FROMAGES",
    "GALERIES",
    "GARDIENS",
    "GENERAUX",
    "GRENIERS",
    "HABITUDE",
    "HISTOIRE",
    "HORIZONS",
    "IMPRIMER",
    "JARDINER",
    "JOURNAUX",
    "LANTERNE",
    "LAVANDES",
    "LECTURES",
    "LOGICIEL",
    "MACHINES",
    "MAGASINS",
    "MANTEAUX",
    "MARCHAND",
    "MATERIEL",
    "MECANISE",
    "MEMOIRES",
    "MONNAIES",
    "MONTAGNE",
    "MUSIQUES",
    "NATIONAL",
    "NATURELS",
    "NOUVELLE",
    "OBJECTIF",
    "OMELETTE",
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

// Découplage total monnaie / classement : le classement se joue en points de
// partie, la monnaie (smotucoin) est créditée en récompenses FIXES par victoire
// (25 mot du jour / 5 manche libre / 6 Mastermind) — deux systèmes sans aucun
// lien mathématique. On peut gagner un peu en jouant, mais juste un peu : la
// balance gains/dépenses penche fortement vers la dépense car des packs de
// smotucoins payants (argent réel) arriveront.
export const SMOTUCOIN_REWARDS: Record<GameMode, number> = {
  daily: 25,
  endless: 5,
  mastermind: 6,
};

export function smotucoinsEarned(
  dailySolved: number,
  endlessSolved: number,
  mastermindSolved: number,
): number {
  return (
    dailySolved * SMOTUCOIN_REWARDS.daily +
    endlessSolved * SMOTUCOIN_REWARDS.endless +
    mastermindSolved * SMOTUCOIN_REWARDS.mastermind
  );
}

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

export type ShopItem = {
  id: ShopItemId;
  name: string;
  description: string;
  category: ShopCategory;
  slot?: ShopEquipSlot;
  price: number;
  repeatable: boolean;
  rarity: ShopRarity;
  sortOrder: number;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
  };
  bundleQuantity?: number;
};

export type ShopPurchase = {
  id: string;
  itemId: ShopItemId;
  quantity: number;
  spent: number;
  createdAt: string;
};

export type ShopInventory = {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  purchases: ShopPurchase[];
  ownedItemIds: ShopItemId[];
  ownedByCategory: Record<ShopCategory, ShopItemId[]>;
  equipped: ShopEquipment;
  publicAvatar: PublicAvatar;
  consumables: {
    hintLetter: number;
    hintPosition: number;
    hintMastermind: number;
  };
  hintLetterCount: number;
  hintPositionCount: number;
  hintMastermindCount: number;
};

export type ShopState = {
  sections: Array<{
    id: ShopCategory;
    title: string;
    description: string;
  }>;
  items: ShopItem[];
  inventory: ShopInventory;
};

export type FriendProfile = {
  userId: string;
  userName: string;
  publicAvatar: PublicAvatar;
};

export type FriendRequest = {
  id: string;
  createdAt: string;
  user: FriendProfile;
};

export type FriendsState = {
  friends: FriendProfile[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
};

export const SHOP_SECTIONS: ShopState["sections"] = [
  {
    id: "avatar",
    title: "Avatars 3D",
    description: "Le visage public du profil et du classement.",
  },
  {
    id: "hat",
    title: "Chapeaux",
    description: "Accessoires posés sur l'avatar.",
  },
  {
    id: "shirt",
    title: "T-shirts",
    description: "Couleurs et maillots de l'avatar.",
  },
  {
    id: "confetti",
    title: "Confettis",
    description: "Effets de victoire équipables.",
  },
  {
    id: "theme",
    title: "Thèmes",
    description: "Ambiances visuelles du site.",
  },
  {
    id: "hint",
    title: "Indices",
    description: "Consommables pour les manches difficiles.",
  },
];

// Économie boutique: prix libellés en smotucoins, crédités en récompenses fixes
// par victoire (voir SMOTUCOIN_REWARDS : 25 mot du jour / 5 manche libre /
// 6 Mastermind), sans aucun lien avec les points du classement. La monnaie est
// volontairement rare et la balance penche vers la dépense car des packs de
// smotucoins payants (argent réel) arriveront : les petits cosmétiques coûtent
// des semaines de jeu, les thèmes premium bien plus.
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "avatar-classic-3d",
    name: "Avatar Smotu 3D",
    description: "Le modèle public par défaut, avec volume et ombre douce.",
    category: "avatar",
    slot: "avatar",
    price: 0,
    repeatable: false,
    rarity: "common",
    sortOrder: 1,
    preview: { primary: "#538d4e", secondary: "#facc15", accent: "#f97316" },
  },
  {
    id: "avatar-renard",
    name: "Avatar Ambre",
    description: "Un modèle vif aux volumes orange et aux reflets dorés.",
    category: "avatar",
    slot: "avatar",
    price: 900,
    repeatable: false,
    rarity: "common",
    sortOrder: 2,
    preview: { primary: "#f97316", secondary: "#fde68a", accent: "#7c2d12" },
  },
  {
    id: "avatar-hibou",
    name: "Avatar Nocturne",
    description: "Un visage calme, parfait pour les séries patientes.",
    category: "avatar",
    slot: "avatar",
    price: 1100,
    repeatable: false,
    rarity: "common",
    sortOrder: 3,
    preview: { primary: "#7c3aed", secondary: "#c4b5fd", accent: "#111827" },
  },
  {
    id: "avatar-slime",
    name: "Avatar Gel",
    description: "Un modèle translucide avec une base souple et brillante.",
    category: "avatar",
    slot: "avatar",
    price: 1300,
    repeatable: false,
    rarity: "rare",
    sortOrder: 4,
    preview: { primary: "#14b8a6", secondary: "#99f6e4", accent: "#0f766e" },
  },
  {
    id: "avatar-robot",
    name: "Avatar Chrome",
    description: "Une tête mécanique low-poly avec reflets métalliques.",
    category: "avatar",
    slot: "avatar",
    price: 1600,
    repeatable: false,
    rarity: "rare",
    sortOrder: 5,
    preview: { primary: "#94a3b8", secondary: "#e2e8f0", accent: "#38bdf8" },
  },
  {
    id: "avatar-astronaute",
    name: "Avatar Orbite",
    description: "Un casque spatial lumineux pour les explorateurs de mots.",
    category: "avatar",
    slot: "avatar",
    price: 2200,
    repeatable: false,
    rarity: "epic",
    sortOrder: 6,
    preview: { primary: "#0ea5e9", secondary: "#e0f2fe", accent: "#f97316" },
  },
  {
    id: "avatar-dragon",
    name: "Avatar Légende",
    description: "Un modèle angulaire, massif, réservé aux gros coffres.",
    category: "avatar",
    slot: "avatar",
    price: 3600,
    repeatable: false,
    rarity: "legendary",
    sortOrder: 7,
    preview: { primary: "#dc2626", secondary: "#fca5a5", accent: "#facc15" },
  },
  {
    id: "avatar-abeille",
    name: "Avatar Bourdon",
    description: "Un modèle rayé et vif qui bourdonne en tête de partie.",
    category: "avatar",
    slot: "avatar",
    price: 1000,
    repeatable: false,
    rarity: "common",
    sortOrder: 8,
    preview: { primary: "#facc15", secondary: "#fef9c3", accent: "#111827" },
  },
  {
    id: "avatar-fantome",
    name: "Avatar Spectre",
    description: "Un visage translucide qui plane au-dessus du classement.",
    category: "avatar",
    slot: "avatar",
    price: 1400,
    repeatable: false,
    rarity: "rare",
    sortOrder: 9,
    preview: { primary: "#e2e8f0", secondary: "#f8fafc", accent: "#818cf8" },
  },
  {
    id: "avatar-yeti",
    name: "Avatar Yéti",
    description: "Une créature glacée et massive pour les longues séries.",
    category: "avatar",
    slot: "avatar",
    price: 2400,
    repeatable: false,
    rarity: "epic",
    sortOrder: 10,
    preview: { primary: "#bae6fd", secondary: "#f0f9ff", accent: "#0ea5e9" },
  },
  {
    id: "avatar-panda",
    name: "Avatar Panda",
    description: "Un modèle noir et blanc placide pour les parties posées.",
    category: "avatar",
    slot: "avatar",
    price: 1500,
    repeatable: false,
    rarity: "rare",
    sortOrder: 11,
    preview: { primary: "#f4f4f5", secondary: "#18181b", accent: "#3f3f46" },
  },
  {
    id: "avatar-citrouille",
    name: "Avatar Citrouille",
    description: "Une tête de citrouille orange pour les séries festives.",
    category: "avatar",
    slot: "avatar",
    price: 2600,
    repeatable: false,
    rarity: "epic",
    sortOrder: 12,
    preview: { primary: "#f97316", secondary: "#7c2d12", accent: "#22c55e" },
  },
  {
    id: "avatar-grenouille",
    name: "Avatar Grenouille",
    description: "Une grenouille verte et vive, prête à bondir en tête de partie.",
    category: "avatar",
    slot: "avatar",
    price: 800,
    repeatable: false,
    rarity: "common",
    sortOrder: 13,
    preview: { primary: "#4ade80", secondary: "#dcfce7", accent: "#166534" },
  },
  {
    id: "avatar-requin",
    name: "Avatar Requin",
    description: "Un requin gris et affûté qui rôde autour du classement.",
    category: "avatar",
    slot: "avatar",
    price: 2600,
    repeatable: false,
    rarity: "epic",
    sortOrder: 14,
    preview: { primary: "#64748b", secondary: "#e2e8f0", accent: "#0f172a" },
  },
  {
    id: "avatar-tigre",
    name: "Avatar Tigre",
    description: "Un félin rayé orange, prêt à bondir sur les mots rares.",
    category: "avatar",
    slot: "avatar",
    price: 1800,
    repeatable: false,
    rarity: "rare",
    sortOrder: 15,
    preview: { primary: "#f97316", secondary: "#ffedd5", accent: "#111827" },
  },
  {
    id: "avatar-licorne",
    name: "Avatar Licorne",
    description: "Une silhouette magique avec corne pastel et museau clair.",
    category: "avatar",
    slot: "avatar",
    price: 3800,
    repeatable: false,
    rarity: "legendary",
    sortOrder: 16,
    preview: { primary: "#f5d0fe", secondary: "#ffffff", accent: "#a855f7" },
  },
  {
    id: "hat-casquette",
    name: "Sans chapeau",
    description: "Le rendu neutre, propre et lisible partout.",
    category: "hat",
    slot: "hat",
    price: 0,
    repeatable: false,
    rarity: "common",
    sortOrder: 1,
    preview: { primary: "#d1d5db", secondary: "#f9fafb", accent: "#6b7280" },
  },
  {
    id: "hat-bonnet-pixel",
    name: "Bonnet pixel",
    description: "Un bonnet compact, idéal pour les profils arcade.",
    category: "hat",
    slot: "hat",
    price: 700,
    repeatable: false,
    rarity: "common",
    sortOrder: 2,
    preview: { primary: "#ef4444", secondary: "#fecaca", accent: "#ffffff" },
  },
  {
    id: "hat-couronne-lowpoly",
    name: "Couronne low-poly",
    description: "Une couronne facettée pour le haut du classement.",
    category: "hat",
    slot: "hat",
    price: 1500,
    repeatable: false,
    rarity: "rare",
    sortOrder: 3,
    preview: { primary: "#facc15", secondary: "#fef3c7", accent: "#b45309" },
  },
  {
    id: "hat-casque-spatial",
    name: "Casque spatial",
    description: "Une visière claire et volumique pour les avatars premium.",
    category: "hat",
    slot: "hat",
    price: 1900,
    repeatable: false,
    rarity: "epic",
    sortOrder: 4,
    preview: { primary: "#38bdf8", secondary: "#e0f2fe", accent: "#f97316" },
  },
  {
    id: "hat-halo",
    name: "Halo parfait",
    description: "Un cercle lumineux pour les résolutions impeccables.",
    category: "hat",
    slot: "hat",
    price: 2600,
    repeatable: false,
    rarity: "legendary",
    sortOrder: 5,
    preview: { primary: "#a855f7", secondary: "#f5d0fe", accent: "#facc15" },
  },
  {
    id: "hat-sorcier",
    name: "Chapeau de sorcier",
    description: "Un chapeau pointu étoilé pour deviner comme par magie.",
    category: "hat",
    slot: "hat",
    price: 1400,
    repeatable: false,
    rarity: "rare",
    sortOrder: 6,
    preview: { primary: "#7c3aed", secondary: "#ddd6fe", accent: "#facc15" },
  },
  {
    id: "hat-viking",
    name: "Casque viking",
    description: "Un casque à cornes pour partir à l'assaut des grilles.",
    category: "hat",
    slot: "hat",
    price: 2000,
    repeatable: false,
    rarity: "epic",
    sortOrder: 7,
    preview: { primary: "#94a3b8", secondary: "#e2e8f0", accent: "#b45309" },
  },
  {
    id: "hat-melon",
    name: "Chapeau melon",
    description: "Un chapeau melon sobre pour un profil tiré à quatre épingles.",
    category: "hat",
    slot: "hat",
    price: 900,
    repeatable: false,
    rarity: "common",
    sortOrder: 8,
    preview: { primary: "#292524", secondary: "#57534e", accent: "#a8a29e" },
  },
  {
    id: "hat-pirate",
    name: "Tricorne pirate",
    description: "Un tricorne à l'abordage pour partir à la chasse aux mots.",
    category: "hat",
    slot: "hat",
    price: 1600,
    repeatable: false,
    rarity: "rare",
    sortOrder: 9,
    preview: { primary: "#1c1917", secondary: "#78716c", accent: "#facc15" },
  },
  {
    id: "hat-cowboy",
    name: "Chapeau de cowboy",
    description: "Un chapeau de cowboy pour mener la partie façon Far West.",
    category: "hat",
    slot: "hat",
    price: 1500,
    repeatable: false,
    rarity: "rare",
    sortOrder: 10,
    preview: { primary: "#92400e", secondary: "#d6a25e", accent: "#451a03" },
  },
  {
    id: "hat-noel",
    name: "Bonnet de Noël",
    description: "Un bonnet de Noël festif pour les victoires d'hiver.",
    category: "hat",
    slot: "hat",
    price: 1600,
    repeatable: false,
    rarity: "rare",
    sortOrder: 11,
    preview: { primary: "#dc2626", secondary: "#ffffff", accent: "#fecaca" },
  },
  {
    id: "hat-ninja",
    name: "Bandeau ninja",
    description: "Un bandeau noué pour deviner en silence.",
    category: "hat",
    slot: "hat",
    price: 1200,
    repeatable: false,
    rarity: "common",
    sortOrder: 12,
    preview: { primary: "#111827", secondary: "#374151", accent: "#ef4444" },
  },
  {
    id: "hat-beret",
    name: "Béret artiste",
    description: "Un béret incliné pour les profils qui jouent avec style.",
    category: "hat",
    slot: "hat",
    price: 1300,
    repeatable: false,
    rarity: "rare",
    sortOrder: 13,
    preview: { primary: "#1e1b4b", secondary: "#c7d2fe", accent: "#f472b6" },
  },
  {
    id: "hat-detective",
    name: "Chapeau détective",
    description: "Un fedora sobre pour enquêter sur chaque lettre.",
    category: "hat",
    slot: "hat",
    price: 2100,
    repeatable: false,
    rarity: "epic",
    sortOrder: 14,
    preview: { primary: "#78350f", secondary: "#fbbf24", accent: "#451a03" },
  },
  {
    id: "shirt-classic",
    name: "T-shirt Smotu",
    description: "La tenue de base, nette dans le profil et le classement.",
    category: "shirt",
    slot: "shirt",
    price: 0,
    repeatable: false,
    rarity: "common",
    sortOrder: 1,
    preview: { primary: "#111318", secondary: "#ffffff", accent: "#538d4e" },
  },
  {
    id: "shirt-neon",
    name: "T-shirt néon",
    description: "Un maillot électrique pour les scores qui flashent.",
    category: "shirt",
    slot: "shirt",
    price: 900,
    repeatable: false,
    rarity: "common",
    sortOrder: 2,
    preview: { primary: "#22d3ee", secondary: "#0f172a", accent: "#a855f7" },
  },
  {
    id: "shirt-mastermind",
    name: "T-shirt Mastermind",
    description: "Quatre pastilles de couleur sur une base sombre.",
    category: "shirt",
    slot: "shirt",
    price: 1300,
    repeatable: false,
    rarity: "rare",
    sortOrder: 3,
    preview: { primary: "#312e81", secondary: "#f8fafc", accent: "#eab308" },
  },
  {
    id: "shirt-champion",
    name: "T-shirt champion",
    description: "Une tenue dorée pour les profils qui restent devant.",
    category: "shirt",
    slot: "shirt",
    price: 2100,
    repeatable: false,
    rarity: "epic",
    sortOrder: 4,
    preview: { primary: "#facc15", secondary: "#111827", accent: "#ffffff" },
  },
  {
    id: "shirt-volcan",
    name: "T-shirt volcan",
    description: "Un dégradé chaud pour les séries explosives.",
    category: "shirt",
    slot: "shirt",
    price: 2700,
    repeatable: false,
    rarity: "legendary",
    sortOrder: 5,
    preview: { primary: "#dc2626", secondary: "#fed7aa", accent: "#f97316" },
  },
  {
    id: "shirt-pixel",
    name: "T-shirt pixel",
    description: "Un maillot rétro tout en gros pixels verts.",
    category: "shirt",
    slot: "shirt",
    price: 800,
    repeatable: false,
    rarity: "common",
    sortOrder: 6,
    preview: { primary: "#22c55e", secondary: "#052e16", accent: "#86efac" },
  },
  {
    id: "shirt-arcenciel",
    name: "T-shirt arc-en-ciel",
    description: "Un dégradé multicolore pour afficher toutes les couleurs.",
    category: "shirt",
    slot: "shirt",
    price: 1400,
    repeatable: false,
    rarity: "rare",
    sortOrder: 7,
    preview: { primary: "#ef4444", secondary: "#3b82f6", accent: "#facc15" },
  },
  {
    id: "shirt-menthe",
    name: "T-shirt menthe",
    description: "Un maillot vert menthe frais et lumineux.",
    category: "shirt",
    slot: "shirt",
    price: 800,
    repeatable: false,
    rarity: "common",
    sortOrder: 8,
    preview: { primary: "#34d399", secondary: "#ecfdf5", accent: "#065f46" },
  },
  {
    id: "shirt-galaxie",
    name: "T-shirt galaxie",
    description: "Un dégradé cosmique parsemé d'étoiles pour les profils rêveurs.",
    category: "shirt",
    slot: "shirt",
    price: 2200,
    repeatable: false,
    rarity: "epic",
    sortOrder: 9,
    preview: { primary: "#312e81", secondary: "#0f172a", accent: "#f0abfc" },
  },
  {
    id: "shirt-marin",
    name: "Marinière",
    description: "Une marinière rayée bleu et blanc, sobre et intemporelle.",
    category: "shirt",
    slot: "shirt",
    price: 800,
    repeatable: false,
    rarity: "common",
    sortOrder: 10,
    preview: { primary: "#1e3a8a", secondary: "#f8fafc", accent: "#ffffff" },
  },
  {
    id: "shirt-cyber",
    name: "T-shirt cyber",
    description: "Un maillot cyber néon pour les profils venus du futur.",
    category: "shirt",
    slot: "shirt",
    price: 3200,
    repeatable: false,
    rarity: "legendary",
    sortOrder: 11,
    preview: { primary: "#0f172a", secondary: "#22d3ee", accent: "#f0abfc" },
  },
  {
    id: "shirt-ninja",
    name: "T-shirt ninja",
    description: "Une tenue sombre barrée d'un accent rouge discret.",
    category: "shirt",
    slot: "shirt",
    price: 1100,
    repeatable: false,
    rarity: "common",
    sortOrder: 12,
    preview: { primary: "#111827", secondary: "#9ca3af", accent: "#ef4444" },
  },
  {
    id: "shirt-detective",
    name: "T-shirt détective",
    description: "Une veste brune élégante pour résoudre les énigmes.",
    category: "shirt",
    slot: "shirt",
    price: 1700,
    repeatable: false,
    rarity: "rare",
    sortOrder: 13,
    preview: { primary: "#78350f", secondary: "#fef3c7", accent: "#f59e0b" },
  },
  {
    id: "shirt-lave",
    name: "T-shirt lave vive",
    description: "Un maillot noir fissuré de lave incandescente.",
    category: "shirt",
    slot: "shirt",
    price: 2900,
    repeatable: false,
    rarity: "epic",
    sortOrder: 14,
    preview: { primary: "#1f0707", secondary: "#fed7aa", accent: "#fb923c" },
  },
  {
    id: "theme-default",
    name: "Thème Smotu",
    description: "La palette originale, claire et lisible.",
    category: "theme",
    slot: "theme",
    price: 0,
    repeatable: false,
    rarity: "common",
    sortOrder: 1,
    preview: { primary: "#538d4e", secondary: "#f5f6f8", accent: "#b59f3b" },
  },
  {
    id: "theme-foret",
    name: "Thème Forêt",
    description: "Une ambiance verte et calme pour les sessions longues.",
    category: "theme",
    slot: "theme",
    price: 1400,
    repeatable: false,
    rarity: "common",
    sortOrder: 2,
    preview: { primary: "#2f855a", secondary: "#edf7ed", accent: "#b59f3b" },
  },
  {
    id: "theme-ocean",
    name: "Thème Océan",
    description: "Des bleus profonds pour garder la tête froide.",
    category: "theme",
    slot: "theme",
    price: 1600,
    repeatable: false,
    rarity: "rare",
    sortOrder: 3,
    preview: { primary: "#0ea5e9", secondary: "#ecfeff", accent: "#14b8a6" },
  },
  {
    id: "theme-sakura",
    name: "Thème Sakura",
    description: "Une palette rose et douce pour célébrer les victoires propres.",
    category: "theme",
    slot: "theme",
    price: 1900,
    repeatable: false,
    rarity: "rare",
    sortOrder: 4,
    preview: { primary: "#db2777", secondary: "#fff1f2", accent: "#f97316" },
  },
  {
    id: "theme-neon",
    name: "Thème Néon",
    description: "Une signature visuelle flashy pour les profils qui claquent.",
    category: "theme",
    slot: "theme",
    price: 2400,
    repeatable: false,
    rarity: "epic",
    sortOrder: 5,
    preview: { primary: "#22d3ee", secondary: "#111827", accent: "#a855f7" },
  },
  {
    id: "theme-minuit",
    name: "Thème Minuit",
    description: "Le thème sombre complet, réservé aux joueurs qui l'achètent.",
    category: "theme",
    slot: "theme",
    price: 2800,
    repeatable: false,
    rarity: "epic",
    sortOrder: 6,
    preview: { primary: "#d7dadc", secondary: "#121213", accent: "#a855f7" },
  },
  {
    id: "theme-auto",
    name: "Mode automatique",
    description: "Suit le thème système clair/sombre. Le sombre reste derrière ce paywall.",
    category: "theme",
    slot: "theme",
    price: 4200,
    repeatable: false,
    rarity: "legendary",
    sortOrder: 7,
    preview: { primary: "#111318", secondary: "#f5f6f8", accent: "#22d3ee" },
  },
  {
    id: "theme-volcan",
    name: "Thème Volcan",
    description: "Un thème chaud et agressif pour les séries explosives.",
    category: "theme",
    slot: "theme",
    price: 3400,
    repeatable: false,
    rarity: "legendary",
    sortOrder: 8,
    preview: { primary: "#dc2626", secondary: "#fff7ed", accent: "#f97316" },
  },
  {
    id: "theme-obsidienne",
    name: "Thème Obsidienne",
    description: "Le thème sombre absolu : noir profond et accents ambre.",
    category: "theme",
    slot: "theme",
    price: 3200,
    repeatable: false,
    rarity: "epic",
    sortOrder: 9,
    preview: { primary: "#f59e0b", secondary: "#0a0a0c", accent: "#fafafa" },
  },
  {
    id: "theme-arctique",
    name: "Thème Arctique",
    description: "Des bleus glacés et clairs pour une ambiance polaire.",
    category: "theme",
    slot: "theme",
    price: 1500,
    repeatable: false,
    rarity: "rare",
    sortOrder: 10,
    preview: { primary: "#0e7490", secondary: "#eef7fa", accent: "#38bdf8" },
  },
  {
    id: "theme-royal",
    name: "Thème Royal",
    description: "Une ambiance claire violet et or pour un profil couronné.",
    category: "theme",
    slot: "theme",
    price: 3000,
    repeatable: false,
    rarity: "epic",
    sortOrder: 11,
    preview: { primary: "#7c3aed", secondary: "#f5f3ff", accent: "#f59e0b" },
  },
  {
    id: "theme-crepuscule",
    name: "Thème Crépuscule",
    description: "Un thème sombre premium, bleu-violet profond aux accents rosés.",
    category: "theme",
    slot: "theme",
    price: 1800,
    repeatable: false,
    rarity: "rare",
    sortOrder: 12,
    preview: { primary: "#818cf8", secondary: "#171528", accent: "#f472b6" },
  },
  {
    id: "theme-desert",
    name: "Thème Désert",
    description: "Une ambiance claire sable et ambre, chaude et lumineuse.",
    category: "theme",
    slot: "theme",
    price: 1600,
    repeatable: false,
    rarity: "rare",
    sortOrder: 13,
    preview: { primary: "#b45309", secondary: "#fdf6e3", accent: "#f59e0b" },
  },
  {
    id: "theme-abysse",
    name: "Thème Abysse",
    description: "Un thème sombre premium, bleu profond des abysses.",
    category: "theme",
    slot: "theme",
    price: 4000,
    repeatable: false,
    rarity: "legendary",
    sortOrder: 14,
    preview: { primary: "#38bdf8", secondary: "#04121f", accent: "#2dd4bf" },
  },
  {
    id: "confetti-classic",
    name: "Confetti Classique",
    description: "L'effet de victoire original, net et coloré.",
    category: "confetti",
    slot: "confetti",
    price: 0,
    repeatable: false,
    rarity: "common",
    sortOrder: 1,
    preview: { primary: "#538d4e", secondary: "#b59f3b", accent: "#f97316" },
  },
  {
    id: "confetti-etoiles",
    name: "Confetti Étoiles",
    description: "Des étoiles qui tombent quand le dernier essai est parfait.",
    category: "confetti",
    slot: "confetti",
    price: 900,
    repeatable: false,
    rarity: "common",
    sortOrder: 2,
    preview: { primary: "#facc15", secondary: "#fef3c7", accent: "#a855f7" },
  },
  {
    id: "confetti-smotucoins",
    name: "Pluie de Smotucoins",
    description: "Une pluie de pièces pour les victoires les plus rentables.",
    category: "confetti",
    slot: "confetti",
    price: 1400,
    repeatable: false,
    rarity: "rare",
    sortOrder: 3,
    preview: { primary: "#facc15", secondary: "#f97316", accent: "#538d4e" },
  },
  {
    id: "confetti-feux-artifice",
    name: "Feux d'artifice",
    description: "Une explosion de couleurs pour les résolutions en peu d'essais.",
    category: "confetti",
    slot: "confetti",
    price: 1800,
    repeatable: false,
    rarity: "epic",
    sortOrder: 4,
    preview: { primary: "#ef4444", secondary: "#22d3ee", accent: "#a855f7" },
  },
  {
    id: "confetti-galaxie",
    name: "Confetti Galaxie",
    description: "Un burst cosmique pour les victoires vraiment stellaires.",
    category: "confetti",
    slot: "confetti",
    price: 2300,
    repeatable: false,
    rarity: "epic",
    sortOrder: 5,
    preview: { primary: "#7c3aed", secondary: "#111827", accent: "#f0abfc" },
  },
  {
    id: "confetti-pluie-or",
    name: "Pluie d'or",
    description: "L'effet le plus luxueux pour transformer une victoire en jackpot.",
    category: "confetti",
    slot: "confetti",
    price: 3100,
    repeatable: false,
    rarity: "legendary",
    sortOrder: 6,
    preview: { primary: "#facc15", secondary: "#fef3c7", accent: "#b45309" },
  },
  {
    id: "confetti-neige",
    name: "Confetti Neige",
    description: "Une chute de flocons pour célébrer les victoires givrées.",
    category: "confetti",
    slot: "confetti",
    price: 1400,
    repeatable: false,
    rarity: "rare",
    sortOrder: 7,
    preview: { primary: "#e0f2fe", secondary: "#ffffff", accent: "#38bdf8" },
  },
  {
    id: "confetti-bulles",
    name: "Confetti Bulles",
    description: "Une envolée de bulles turquoise pour des victoires pétillantes.",
    category: "confetti",
    slot: "confetti",
    price: 1000,
    repeatable: false,
    rarity: "common",
    sortOrder: 8,
    preview: { primary: "#22d3ee", secondary: "#e0f2fe", accent: "#38bdf8" },
  },
  {
    id: "confetti-lave",
    name: "Confetti Lave",
    description: "Une gerbe de lave incandescente pour les séries brûlantes.",
    category: "confetti",
    slot: "confetti",
    price: 2400,
    repeatable: false,
    rarity: "epic",
    sortOrder: 9,
    preview: { primary: "#ef4444", secondary: "#f97316", accent: "#facc15" },
  },
  {
    id: "confetti-emeraude",
    name: "Confetti Émeraude",
    description: "Une pluie d'émeraude scintillante pour les victoires précieuses.",
    category: "confetti",
    slot: "confetti",
    price: 1500,
    repeatable: false,
    rarity: "rare",
    sortOrder: 10,
    preview: { primary: "#10b981", secondary: "#a7f3d0", accent: "#065f46" },
  },
  {
    id: "confetti-or-rose",
    name: "Confetti Or rose",
    description: "Un burst or rose ultra chic pour les résolutions parfaites.",
    category: "confetti",
    slot: "confetti",
    price: 3400,
    repeatable: false,
    rarity: "legendary",
    sortOrder: 11,
    preview: { primary: "#fb7185", secondary: "#fda4af", accent: "#facc15" },
  },
  {
    id: "confetti-rubis",
    name: "Confetti Rubis",
    description: "Des éclats rouges et brillants pour les victoires flamboyantes.",
    category: "confetti",
    slot: "confetti",
    price: 1700,
    repeatable: false,
    rarity: "rare",
    sortOrder: 12,
    preview: { primary: "#dc2626", secondary: "#fecaca", accent: "#7f1d1d" },
  },
  {
    id: "confetti-citrons",
    name: "Confetti Citrons",
    description: "Une pluie jaune et verte, fraîche comme une série parfaite.",
    category: "confetti",
    slot: "confetti",
    price: 1000,
    repeatable: false,
    rarity: "common",
    sortOrder: 13,
    preview: { primary: "#facc15", secondary: "#bef264", accent: "#65a30d" },
  },
  {
    id: "confetti-cosmos",
    name: "Confetti Cosmos",
    description: "Un final spatial sombre, violet et turquoise.",
    category: "confetti",
    slot: "confetti",
    price: 3600,
    repeatable: false,
    rarity: "legendary",
    sortOrder: 14,
    preview: { primary: "#4c1d95", secondary: "#22d3ee", accent: "#f0abfc" },
  },
  {
    id: "hint-letter-pack",
    name: "Pack indice lettre x3",
    description: "Trois indices qui révèlent une lettre présente dans une grille de mots.",
    category: "hint",
    price: 1200,
    repeatable: true,
    rarity: "common",
    sortOrder: 1,
    bundleQuantity: 3,
    preview: { primary: "#b59f3b", secondary: "#fff7da", accent: "#111318" },
  },
  {
    id: "hint-position-pack",
    name: "Pack indice position x2",
    description: "Deux indices plus forts qui révèlent une lettre bien placée.",
    category: "hint",
    price: 1700,
    repeatable: true,
    rarity: "rare",
    sortOrder: 2,
    bundleQuantity: 2,
    preview: { primary: "#538d4e", secondary: "#d9f99d", accent: "#111318" },
  },
  {
    id: "hint-mastermind-pack",
    name: "Pack indice Mastermind x2",
    description: "Deux aides dédiées aux codes couleur les plus coriaces.",
    category: "hint",
    price: 1500,
    repeatable: true,
    rarity: "rare",
    sortOrder: 3,
    bundleQuantity: 2,
    preview: { primary: "#a855f7", secondary: "#f3e8ff", accent: "#111318" },
  },
];

export function shopItemById(itemId: unknown): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === itemId);
}

export function defaultOwnedItemIds(): ShopItemId[] {
  return [
    DEFAULT_SHOP_EQUIPMENT.avatar,
    DEFAULT_SHOP_EQUIPMENT.hat,
    DEFAULT_SHOP_EQUIPMENT.shirt,
    DEFAULT_SHOP_EQUIPMENT.confetti,
    DEFAULT_SHOP_EQUIPMENT.theme,
  ];
}

export function publicAvatarFromEquipment(equipped: ShopEquipment): PublicAvatar {
  return {
    avatarId: equipped.avatar ?? DEFAULT_PUBLIC_AVATAR.avatarId,
    hatId:
      equipped.hat && equipped.hat !== DEFAULT_SHOP_EQUIPMENT.hat
        ? equipped.hat
        : undefined,
    shirtId: equipped.shirt ?? DEFAULT_PUBLIC_AVATAR.shirtId,
    confettiId: equipped.confetti ?? DEFAULT_PUBLIC_AVATAR.confettiId,
    themeId: equipped.theme ?? DEFAULT_PUBLIC_AVATAR.themeId,
  };
}
