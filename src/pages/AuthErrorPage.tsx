import { Link, useSearchParams } from "react-router-dom";
import { Panel, SectionKicker } from "../components/ui";

function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/profile";
  }

  return value;
}

function authErrorCopy(error: string | null): {
  title: string;
  description: string;
} {
  if (error === "access_denied") {
    return {
      title: "Connexion annulée",
      description:
        "L'autorisation Google a été annulée. Ton compte n'a pas été connecté.",
    };
  }

  return {
    title: "Connexion impossible",
    description:
      "Google n'a pas pu finaliser la connexion. Tu peux réessayer ou revenir à la page précédente.",
  };
}

export function AuthErrorPage() {
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("returnTo"));
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const copy = authErrorCopy(error);
  const retryURL = `/auth?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <div className="mx-auto grid min-h-[inherit] max-w-6xl place-items-center px-4 py-8">
      <Panel className="w-full max-w-md space-y-5 text-center">
        <div>
          <SectionKicker>Google</SectionKicker>
          <h2 className="mt-2 text-3xl font-black">{copy.title}</h2>
          <p className="mt-3 text-sm leading-6 text-subtle-foreground">
            {copy.description}
          </p>
        </div>

        {errorDescription ? (
          <p className="rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold text-muted-foreground">
            {errorDescription}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md bg-success px-4 text-sm font-bold uppercase tracking-wide text-success-foreground transition hover:bg-success-hover"
            to={retryURL}
          >
            Réessayer
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md bg-secondary px-4 text-sm font-bold uppercase tracking-wide text-secondary-foreground transition hover:bg-secondary-hover"
            to={returnTo}
          >
            Retour
          </Link>
        </div>
      </Panel>
    </div>
  );
}
