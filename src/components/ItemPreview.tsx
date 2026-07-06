import type { ShopItem } from "../../shared/game";

// Aperçus dédiés aux cosmétiques non portés par l'avatar (thèmes, confettis,
// indices). Tous en size-24 pour garder l'alignement des cartes de la boutique
// et de l'inventaire. Chaque aperçu s'appuie sur item.preview {primary,
// secondary, accent} pour rester fidèle à la palette de l'objet.

const PREVIEW_SHADOW =
  "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_12px_24px_rgb(0_0_0/0.08)]";

// Aperçu d'un thème : une mini-fenêtre d'application re-thémée (barre de titre,
// rangée de tuiles de lettres et lignes de texte simulées).
export function ThemePreview({ item }: { item: ShopItem }) {
  const { primary, secondary, accent } = item.preview;

  return (
    <div
      className={`size-24 overflow-hidden rounded-xl border border-border/60 ${PREVIEW_SHADOW}`}
      style={{ background: secondary }}
    >
      <div
        className="flex h-5 items-center gap-1 px-2"
        style={{ background: primary }}
      >
        <span className="size-1.5 rounded-full bg-white/70" />
        <span className="size-1.5 rounded-full bg-white/45" />
        <span className="size-1.5 rounded-full bg-white/25" />
      </div>
      <div className="flex flex-col gap-2 p-2">
        <div className="flex gap-1">
          <span
            className="size-4 rounded-[3px]"
            style={{ background: primary }}
          />
          <span
            className="size-4 rounded-[3px]"
            style={{ background: accent }}
          />
          <span
            className="size-4 rounded-[3px]"
            style={{
              background: secondary,
              boxShadow: "inset 0 0 0 1.5px rgb(120 120 120 / 0.45)",
            }}
          />
        </div>
        <span
          className="h-1.5 w-full rounded-full opacity-50"
          style={{ background: primary }}
        />
        <span
          className="h-1.5 w-2/3 rounded-full opacity-30"
          style={{ background: primary }}
        />
      </div>
    </div>
  );
}

// Positions/rotations FIXES (pas de random) : plus de confettis en haut pour
// évoquer la retombée, couleurs cyclant primary/secondary/accent par index.
const CONFETTI_PIECES = [
  { left: "14%", top: "5%", rotate: -24 },
  { left: "38%", top: "3%", rotate: 32 },
  { left: "62%", top: "6%", rotate: -12 },
  { left: "84%", top: "4%", rotate: 44 },
  { left: "24%", top: "14%", rotate: 18 },
  { left: "52%", top: "16%", rotate: -38 },
  { left: "74%", top: "18%", rotate: 12 },
  { left: "16%", top: "28%", rotate: -16 },
  { left: "58%", top: "32%", rotate: 40 },
  { left: "34%", top: "46%", rotate: -28 },
  { left: "78%", top: "52%", rotate: 22 },
  { left: "22%", top: "68%", rotate: -34 },
] as const;

// Aperçu d'un effet de confettis : une carte parsemée de petits confettis.
export function ConfettiPreview({ item }: { item: ShopItem }) {
  const colors = [
    item.preview.primary,
    item.preview.secondary,
    item.preview.accent,
  ];

  return (
    <div
      className={`relative size-24 overflow-hidden rounded-lg bg-card ${PREVIEW_SHADOW}`}
    >
      {CONFETTI_PIECES.map((piece, index) => (
        <span
          className="absolute h-3 w-1.5 rounded-[2px] shadow-[0_1px_2px_rgb(0_0_0/0.15)]"
          key={index}
          style={{
            left: piece.left,
            top: piece.top,
            background: colors[index % colors.length],
            transform: `rotate(${piece.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// Aperçu d'un pack d'indices : une grande tuile de lettre marquée d'un « ? ».
export function HintPreview({ item }: { item: ShopItem }) {
  return (
    <div
      className={`grid size-24 place-items-center rounded-lg bg-card ${PREVIEW_SHADOW}`}
    >
      <div
        className="grid size-16 place-items-center rounded-xl border-2 shadow-inner"
        style={{
          background: item.preview.primary,
          borderColor: item.preview.accent,
        }}
      >
        <span
          className="text-4xl font-black leading-none"
          style={{ color: item.preview.secondary }}
        >
          ?
        </span>
      </div>
    </div>
  );
}
