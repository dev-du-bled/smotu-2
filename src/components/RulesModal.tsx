import { useEffect } from "react";
import { PointsAmount } from "./ui";

export function RulesModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[var(--overlay)] px-4 py-6"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        aria-labelledby="rules-title"
        aria-modal="true"
        className="w-full max-w-xl rounded-lg border border-input bg-card p-5 shadow-2xl"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Règles
            </p>
            <h2 id="rules-title" className="mt-2 text-3xl font-black">
              Comment jouer à Smotu
            </h2>
          </div>
          <button
            className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-xl font-black text-subtle-foreground transition hover:bg-secondary"
            type="button"
            aria-label="Fermer"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm leading-6 text-subtle-foreground">
          <p>
            Devine un mot de cinq lettres en six essais. Tu peux proposer le mot
            que tu veux tant qu'il fait cinq lettres.
          </p>

          <div className="grid gap-2">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded bg-success font-black text-success-foreground">
                S
              </span>
              <p>Vert: la lettre est bien placée.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded bg-warning font-black text-warning-foreground">
                M
              </span>
              <p>Jaune: la lettre est dans le mot, mais ailleurs.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded bg-secondary font-black text-secondary-foreground">
                X
              </span>
              <p>Gris: la lettre n'est pas dans le mot.</p>
            </div>
          </div>

          <div className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2">
            <div>
              <p className="font-black text-foreground">Mot du jour</p>
              <p className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
                Une grille par jour, jusqu'à
                <PointsAmount className="font-black" iconClassName="size-4" value={900} />
              </p>
            </div>
            <div>
              <p className="font-black text-foreground">Mode libre</p>
              <p className="text-muted-foreground">Manches illimitées, plus de points sur les mots longs.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
