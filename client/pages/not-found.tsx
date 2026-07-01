import { Link } from "lakebed/client";
import { SectionKicker } from "../components/ui";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-65px)] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <SectionKicker>Page introuvable</SectionKicker>
      <h2 className="mt-3 text-4xl font-black">Cette route n'existe pas.</h2>
      <p className="mt-4 text-[#d7dadc]">
        Reviens à l'accueil ou lance directement le mot du jour.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md bg-[#f8f8f8] px-4 text-sm font-bold uppercase tracking-wide text-[#121213] transition hover:bg-white"
          to="/"
        >
          Accueil
        </Link>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md bg-[#538d4e] px-4 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#5f9b59]"
          to="/play"
        >
          Jouer
        </Link>
      </div>
    </div>
  );
}
