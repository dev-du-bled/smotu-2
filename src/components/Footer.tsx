import { useState } from "react";
import { Link } from "react-router-dom";
import { RulesModal } from "./RulesModal";

function FooterLink({ children, to }: { children: string; to: string }) {
  return (
    <Link className="block py-1.5 transition hover:text-white" to={to}>
      {children}
    </Link>
  );
}

function FooterTitle({ children }: { children: string }) {
  return (
    <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#565758]">
      {children}
    </p>
  );
}

export function Footer() {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <footer className="border-t border-[#2f3033]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-7 px-4 py-8 text-sm text-[#818384]">
        <div className="max-w-xs">
          <p className="text-lg font-black uppercase tracking-[0.08em] text-white">
            Smotu
          </p>
          <p className="mt-2 max-w-xs leading-6">
            Une réadaptation du grand Smotu, avec deux modes et un classement
            global.
          </p>
        </div>

        <nav aria-label="Footer jouer">
          <FooterTitle>Jouer</FooterTitle>
          <FooterLink to="/">Accueil</FooterLink>
          <FooterLink to="/play">Mot du jour</FooterLink>
          <FooterLink to="/endless">Mode libre</FooterLink>
        </nav>

        <nav aria-label="Footer score">
          <FooterTitle>Score</FooterTitle>
          <FooterLink to="/leaderboard">Classement</FooterLink>
          <FooterLink to="/profile">Mon profil</FooterLink>
        </nav>

        <div>
          <FooterTitle>Aide</FooterTitle>
          <button
            className="block py-1.5 text-left transition hover:text-white"
            type="button"
            onClick={() => setRulesOpen(true)}
          >
            Règles du jeu
          </button>
          <p className="mt-2 leading-6 text-[#565758]">
            Cinq lettres, six essais, propositions libres.
          </p>
        </div>
      </div>
      {rulesOpen ? <RulesModal onClose={() => setRulesOpen(false)} /> : null}
    </footer>
  );
}
