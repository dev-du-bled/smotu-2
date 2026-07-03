import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthForm, type EmailAuthInput } from "../components/AuthForm";
import { Panel, SectionKicker, Skeleton } from "../components/ui";

function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/profile";
  }

  return value;
}

export function AuthPage({
  loading,
  onEmailSignIn,
  onEmailSignUp,
  onGoogleSignIn,
  signedIn,
}: {
  loading: boolean;
  onEmailSignIn: (input: EmailAuthInput) => Promise<void>;
  onEmailSignUp: (input: EmailAuthInput) => Promise<void>;
  onGoogleSignIn: () => void | Promise<void>;
  signedIn: boolean;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("returnTo"));

  useEffect(() => {
    if (signedIn) {
      navigate(returnTo, { replace: true });
    }
  }, [navigate, returnTo, signedIn]);

  return (
    <div className="mx-auto grid min-h-[inherit] max-w-6xl place-items-center px-4 py-8">
      <div className="grid w-full max-w-md gap-5">
        <div className="text-center">
          <SectionKicker>Compte</SectionKicker>
          <h2 className="mt-2 text-4xl font-black">Connexion</h2>
          <p className="mt-2 text-subtle-foreground">
            Connecte-toi avec Google ou avec un email pour enregistrer tes
            scores.
          </p>
        </div>

        <Panel className="space-y-5">
          {loading ? (
            <div className="grid gap-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <AuthForm
              onEmailSignIn={onEmailSignIn}
              onEmailSignUp={onEmailSignUp}
              onGoogleSignIn={onGoogleSignIn}
            />
          )}
        </Panel>

        <Link
          className="text-center text-sm font-semibold text-muted-foreground transition hover:text-subtle-foreground"
          to="/"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
