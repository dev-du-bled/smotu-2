import { Link, useLocation } from "react-router-dom";
import { Panel, SectionKicker, Skeleton } from "./ui";

function authTarget(pathname: string, search: string): string {
  const returnTo = `${pathname}${search}`;
  return `/auth?returnTo=${encodeURIComponent(returnTo)}`;
}

export function AuthRequired({
  actionLabel = "Se connecter",
  description = "Smotu utilise Better Auth pour attribuer les points au bon joueur.",
  loading = false,
  title = "Connecte-toi pour continuer.",
  eyebrow = "Connexion requise",
}: {
  actionLabel?: string;
  description?: string;
  eyebrow?: string;
  loading?: boolean;
  title?: string;
}) {
  const location = useLocation();

  return (
    <div className="mx-auto flex min-h-[inherit] max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
      <Panel className="w-full space-y-5">
        <SectionKicker>{eyebrow}</SectionKicker>
        <h2 className="text-4xl font-black">{title}</h2>
        <p className="text-subtle-foreground">{description}</p>
        {loading ? (
          <Skeleton className="mx-auto h-12 w-52" />
        ) : (
          <Link
            className="mx-auto inline-flex h-12 items-center justify-center rounded-md bg-success px-5 text-base font-bold uppercase tracking-wide text-success-foreground transition hover:bg-success-hover"
            to={authTarget(location.pathname, location.search)}
          >
            {actionLabel}
          </Link>
        )}
      </Panel>
    </div>
  );
}
