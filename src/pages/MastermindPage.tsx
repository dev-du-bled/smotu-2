import type { FormEvent } from "react";
import {
  MASTERMIND_COLORS,
  type MastermindAttempt,
  type MastermindColorId,
  type MastermindGameState,
} from "../../shared/game";
import { AuthRequired } from "../components/AuthRequired";
import { ConfettiBurst } from "../components/ConfettiBurst";
import { Button, Panel, ProgressStrip, SectionKicker } from "../components/ui";

const COLOR_BY_ID = Object.fromEntries(
  MASTERMIND_COLORS.map((color) => [color.id, color]),
) as Record<MastermindColorId, (typeof MASTERMIND_COLORS)[number]>;

function ColorPeg({
  color,
  empty = false,
  label,
  size = "md",
}: {
  color?: MastermindColorId;
  empty?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const colorMeta = color ? COLOR_BY_ID[color] : undefined;
  const sizes = {
    sm: "size-5",
    md: "size-9",
    lg: "size-11",
  };

  return (
    <span
      aria-label={label ?? colorMeta?.name ?? "Emplacement vide"}
      className={`${sizes[size]} inline-flex shrink-0 rounded-full border-2 ${
        empty
          ? "border-dashed border-[#565758] bg-transparent"
          : "border-white/20 shadow-[inset_0_-3px_0_rgba(0,0,0,0.24)]"
      }`}
      role="img"
      style={colorMeta && !empty ? { backgroundColor: colorMeta.hex } : undefined}
    />
  );
}

function FeedbackPegs({ exact, present }: { exact: number; present: number }) {
  const pegs = [
    ...Array.from({ length: exact }, (_, index) => ({
      key: `exact-${index}`,
      className: "bg-[#f8f8f8]",
      label: "Bien place",
    })),
    ...Array.from({ length: present }, (_, index) => ({
      key: `present-${index}`,
      className: "bg-[#b59f3b]",
      label: "Bonne couleur",
    })),
  ];

  return (
    <div
      className="grid grid-cols-2 gap-1"
      aria-label={`${exact} bien placées, ${present} bonnes couleurs`}
    >
      {Array.from({ length: 4 }, (_, index) => {
        const peg = pegs[index];

        return (
          <span
            aria-label={peg?.label ?? "Indice vide"}
            className={`size-3 rounded-full ${
              peg?.className ?? "bg-[#3a3a3c]"
            }`}
            key={peg?.key ?? `empty-${index}`}
          />
        );
      })}
    </div>
  );
}

function AttemptRow({ attempt }: { attempt: MastermindAttempt }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-[#2f3033] bg-[#18191b] p-3">
      <p className="w-8 font-mono text-sm font-black text-[#818384]">
        {attempt.attemptNumber}
      </p>
      <div className="flex gap-2">
        {attempt.guess.map((color, index) => (
          <ColorPeg
            color={color}
            key={`${attempt.id}-${index}`}
            label={COLOR_BY_ID[color].name}
          />
        ))}
      </div>
      <FeedbackPegs exact={attempt.exact} present={attempt.present} />
    </div>
  );
}

function AnswerReveal({ answer }: { answer: MastermindColorId[] }) {
  if (!answer.length) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-[#f97316]/50 bg-[#21180f] p-3">
      <p className="text-sm font-bold text-[#d7dadc]">Code secret</p>
      <div className="flex gap-2">
        {answer.map((color, index) => (
          <ColorPeg
            color={color}
            key={`${color}-${index}`}
            label={COLOR_BY_ID[color].name}
            size="sm"
          />
        ))}
      </div>
    </div>
  );
}

function statusText(game: MastermindGameState, pendingGuess: boolean): string {
  const remaining = game.maxAttempts - game.attempts.length;

  if (pendingGuess) {
    return "Analyse du code...";
  }
  if (game.solved) {
    const attempt = game.attempts.find((item) => item.solved);
    return `Code trouvé en ${attempt?.attemptNumber ?? 0} essais. Score: ${
      attempt?.score ?? 0
    }.`;
  }
  if (game.over) {
    return "Manche terminée. Le code secret est affiché.";
  }
  return `${remaining} ${remaining > 1 ? "essais restants" : "essai restant"}.`;
}

export function MastermindPage({
  addColor,
  authLoading = false,
  canSubmit,
  celebrationKey,
  clearGuess,
  game,
  guess,
  isStarting,
  localError,
  onSignIn,
  onSubmit,
  pendingGuess,
  progress,
  removeColor,
  signedIn,
  startRound,
}: {
  addColor: (color: MastermindColorId) => void;
  authLoading?: boolean;
  canSubmit: boolean;
  celebrationKey?: string;
  clearGuess: () => void;
  game?: MastermindGameState;
  guess: MastermindColorId[];
  isStarting: boolean;
  localError: string;
  onSignIn: () => void | Promise<void>;
  onSubmit: (event?: FormEvent) => void | Promise<void>;
  pendingGuess: boolean;
  progress: number;
  removeColor: () => void;
  signedIn: boolean;
  startRound: () => void | Promise<void>;
}) {
  if (!signedIn || !game) {
    return (
      <AuthRequired
        loading={authLoading}
        title={
          authLoading
            ? "Vérification de ta session."
            : "Connecte-toi pour jouer au Mastermind."
        }
        description="Mastermind enregistre tes manches et ajoute tes points au classement global."
        eyebrow="Mastermind"
      />
    );
  }

  if (game.status === "idle") {
    return (
      <div className="mx-auto flex min-h-[inherit] max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
        <Panel className="w-full space-y-5">
          <SectionKicker>Mastermind</SectionKicker>
          <h2 className="text-4xl font-black">Casse le code couleur.</h2>
          <p className="text-[#d7dadc]">
            Trouve une combinaison de quatre couleurs. Un pion blanc indique une
            couleur bien placée, un pion jaune une bonne couleur au mauvais
            endroit.
          </p>
          <Button
            disabled={isStarting}
            size="lg"
            type="button"
            variant="success"
            onClick={startRound}
          >
            {isStarting ? "Lancement..." : "Nouvelle manche"}
          </Button>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-h-[inherit] max-w-6xl gap-6 px-4 py-5 lg:grid-cols-[1fr_360px]">
      <ConfettiBurst burstKey={celebrationKey} />

      <section className="mx-auto w-full max-w-xl space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionKicker>Mastermind</SectionKicker>
            <p className="mt-1 text-sm font-semibold text-[#d7dadc]">
              Manche #{game.gamesPlayed} · jusqu'à 560 points
            </p>
          </div>
          {game.over ? (
            <Button
              disabled={isStarting}
              size="sm"
              type="button"
              variant="secondary"
              onClick={startRound}
            >
              {isStarting ? "Lancement..." : "Rejouer"}
            </Button>
          ) : null}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-[#818384]">
            <span>Progression</span>
            <span>
              {game.attempts.length}/{game.maxAttempts}
            </span>
          </div>
          <ProgressStrip value={progress} />
        </div>

        <div className="grid gap-2">
          {game.attempts.length ? (
            game.attempts.map((attempt) => (
              <AttemptRow attempt={attempt} key={attempt.id} />
            ))
          ) : (
            <div className="rounded-md border border-dashed border-[#3a3a3c] p-5 text-center text-sm text-[#818384]">
              Aucune proposition pour le moment.
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <Panel className="space-y-4">
          <div>
            <SectionKicker>Proposition</SectionKicker>
            <p className="mt-2 text-sm text-[#818384]">
              Choisis quatre couleurs, les doublons sont autorisés.
            </p>
          </div>

          <form className="space-y-4" onSubmit={(event) => onSubmit(event)}>
            <div className="flex justify-center gap-2">
              {Array.from({ length: game.codeLength }, (_, index) => (
                <ColorPeg
                  color={guess[index]}
                  empty={!guess[index]}
                  key={index}
                  label={
                    guess[index]
                      ? COLOR_BY_ID[guess[index]].name
                      : `Emplacement ${index + 1}`
                  }
                  size="lg"
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {MASTERMIND_COLORS.map((color) => (
                <button
                  aria-label={`Ajouter ${color.name}`}
                  className="grid h-12 place-items-center rounded-md border border-[#3a3a3c] bg-[#272729] transition hover:border-white/60"
                  disabled={game.over || pendingGuess}
                  key={color.id}
                  type="button"
                  onClick={() => addColor(color.id)}
                >
                  <ColorPeg color={color.id} size="sm" />
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                disabled={!guess.length || pendingGuess}
                type="button"
                variant="secondary"
                onClick={removeColor}
              >
                Retour
              </Button>
              <Button
                disabled={!guess.length || pendingGuess}
                type="button"
                variant="ghost"
                onClick={clearGuess}
              >
                Effacer
              </Button>
            </div>

            <Button
              className="w-full"
              disabled={!canSubmit}
              size="lg"
              type="submit"
              variant="success"
            >
              Valider
            </Button>
          </form>

          <p className="min-h-6 text-center text-sm font-semibold text-[#d7dadc]">
            {localError || statusText(game, pendingGuess)}
          </p>
        </Panel>

        <AnswerReveal answer={game.answer} />
      </aside>
    </div>
  );
}
