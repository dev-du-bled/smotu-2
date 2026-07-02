import { Button, Panel, SectionKicker, Skeleton } from "./ui";

export function AuthRequired({
  actionLabel = "Continuer avec Google",
  description = "Smotu utilise Shoo pour te connecter avec Google et attribuer les points au bon joueur.",
  loading = false,
  onSignIn,
  title = "Connecte-toi pour continuer.",
  eyebrow = "Connexion requise",
}: {
  actionLabel?: string;
  description?: string;
  eyebrow?: string;
  loading?: boolean;
  onSignIn: () => void | Promise<void>;
  title?: string;
}) {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
      <Panel className="w-full space-y-5">
        <SectionKicker>{eyebrow}</SectionKicker>
        <h2 className="text-4xl font-black">{title}</h2>
        <p className="text-[#d7dadc]">{description}</p>
        {loading ? (
          <Skeleton className="mx-auto h-12 w-52" />
        ) : (
          <Button size="lg" type="button" variant="success" onClick={onSignIn}>
            {actionLabel}
          </Button>
        )}
      </Panel>
    </div>
  );
}
