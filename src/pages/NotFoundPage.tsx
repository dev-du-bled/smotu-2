import { Link } from "react-router-dom";
import { SectionKicker } from "../components/ui";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[inherit] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <SectionKicker>Page introuvable</SectionKicker>
      <h2 className="mt-3 text-4xl font-black">Cette route n'existe pas.</h2>
      <p className="mt-4 text-subtle-foreground">
        Reviens à l'accueil ou lance directement le mot du jour.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-bold uppercase tracking-wide text-primary-foreground transition hover:bg-primary"
          to="/"
        >
          Accueil
        </Link>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md bg-success px-4 text-sm font-bold uppercase tracking-wide text-success-foreground transition hover:bg-success-hover"
          to="/play"
        >
          Jouer
        </Link>
      </div>
    </div>
  );
}
