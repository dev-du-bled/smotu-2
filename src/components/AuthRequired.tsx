import { Button, Panel, SectionKicker } from "./ui";

export function AuthRequired({
  onSignIn,
}: {
  onSignIn: () => void | Promise<void>;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-65px)] max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
      <Panel className="w-full space-y-5">
        <SectionKicker>Connexion</SectionKicker>
        <h2 className="text-4xl font-black">Connecte-toi pour jouer.</h2>
        <p className="text-[#d7dadc]">
          Smotu utilise Shoo pour te connecter avec Google et attribuer les
          points au bon joueur.
        </p>
        <Button size="lg" type="button" variant="success" onClick={onSignIn}>
          Continuer avec Google
        </Button>
      </Panel>
    </div>
  );
}
