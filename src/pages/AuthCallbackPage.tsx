import { Panel, SectionKicker } from "../components/ui";

export function AuthCallbackPage() {
  return (
    <div className="mx-auto flex min-h-[inherit] max-w-xl flex-col items-center justify-center px-4 text-center">
      <Panel className="w-full space-y-3">
        <SectionKicker>Google</SectionKicker>
        <h2 className="text-3xl font-black">Connexion en cours...</h2>
        <p className="text-sm text-muted-foreground">
          Better Auth termine l'authentification Google et te renvoie dans Smotu.
        </p>
      </Panel>
    </div>
  );
}
