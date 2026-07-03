import { useState, type FormEvent } from "react";
import { Button, Input } from "./ui";

export type EmailAuthInput = {
  email: string;
  name?: string;
  password: string;
};

type EmailMode = "sign-in" | "sign-up";

export function AuthForm({
  onEmailSignIn,
  onEmailSignUp,
  onGoogleSignIn,
}: {
  onEmailSignIn: (input: EmailAuthInput) => Promise<void>;
  onEmailSignUp: (input: EmailAuthInput) => Promise<void>;
  onGoogleSignIn: () => void | Promise<void>;
}) {
  const [mode, setMode] = useState<EmailMode>("sign-in");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submitEmail(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    try {
      const input = {
        email: email.trim(),
        name: name.trim(),
        password,
      };

      if (mode === "sign-in") {
        await onEmailSignIn(input);
      } else {
        await onEmailSignUp(input);
      }
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Authentification impossible.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4 text-left">
      <Button
        className="w-full"
        size="lg"
        type="button"
        variant="success"
        onClick={onGoogleSignIn}
      >
        Continuer avec Google
      </Button>

      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>Email</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-2 rounded-md bg-muted p-1">
        <button
          className={`rounded px-3 py-2 text-sm font-bold transition ${
            mode === "sign-in"
              ? "bg-primary text-primary-foreground"
              : "text-subtle-foreground hover:bg-secondary"
          }`}
          type="button"
          onClick={() => {
            setMode("sign-in");
            setMessage("");
          }}
        >
          Connexion
        </button>
        <button
          className={`rounded px-3 py-2 text-sm font-bold transition ${
            mode === "sign-up"
              ? "bg-primary text-primary-foreground"
              : "text-subtle-foreground hover:bg-secondary"
          }`}
          type="button"
          onClick={() => {
            setMode("sign-up");
            setMessage("");
          }}
        >
          Inscription
        </button>
      </div>

      <form className="grid gap-3" onSubmit={submitEmail}>
        {mode === "sign-up" ? (
          <Input
            aria-label="Pseudo"
            autoComplete="name"
            className="font-sans text-base font-semibold normal-case"
            placeholder="Pseudo"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
        ) : null}
        <Input
          aria-label="Email"
          autoComplete="email"
          className="font-sans text-base font-semibold normal-case"
          placeholder="Email"
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
        />
        <Input
          aria-label="Mot de passe"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          className="font-sans text-base font-semibold normal-case"
          minLength={8}
          placeholder="Mot de passe"
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
        />
        <Button
          className="w-full"
          disabled={pending}
          size="lg"
          type="submit"
          variant="primary"
        >
          {pending
            ? "Patiente..."
            : mode === "sign-in"
              ? "Se connecter"
              : "Créer le compte"}
        </Button>
        {message ? (
          <p className="text-center text-sm font-semibold text-destructive">
            {message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
