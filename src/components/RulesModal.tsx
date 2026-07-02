import { useEffect } from "react";

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
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-6"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        aria-labelledby="rules-title"
        aria-modal="true"
        className="w-full max-w-xl rounded-lg border border-[#3a3a3c] bg-[#18191b] p-5 shadow-2xl"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#818384]">
              Règles
            </p>
            <h2 id="rules-title" className="mt-2 text-3xl font-black">
              Comment jouer à Smotu
            </h2>
          </div>
          <button
            className="grid size-9 shrink-0 place-items-center rounded-md bg-[#272729] text-xl font-black text-[#d7dadc] transition hover:bg-[#3a3a3c]"
            type="button"
            aria-label="Fermer"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm leading-6 text-[#d7dadc]">
          <p>
            Devine un mot de cinq lettres en six essais. Tu peux proposer le mot
            que tu veux tant qu'il fait cinq lettres.
          </p>

          <div className="grid gap-2">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded bg-[#538d4e] font-black text-white">
                S
              </span>
              <p>Vert: la lettre est bien placée.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded bg-[#b59f3b] font-black text-white">
                M
              </span>
              <p>Jaune: la lettre est dans le mot, mais ailleurs.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded bg-[#3a3a3c] font-black text-white">
                X
              </span>
              <p>Gris: la lettre n'est pas dans le mot.</p>
            </div>
          </div>

          <div className="grid gap-3 rounded-md border border-[#2f3033] p-3 sm:grid-cols-2">
            <div>
              <p className="font-black text-white">Mot du jour</p>
              <p className="text-[#818384]">Une grille par jour, jusqu'à 900 points.</p>
            </div>
            <div>
              <p className="font-black text-white">Mode libre</p>
              <p className="text-[#818384]">Manches illimitées, jusqu'à 360 points.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
