import type { FormEvent, ReactNode } from "react";
import {
  MASTERMIND_COLORS,
  type MastermindColorId,
  type MastermindGameState,
  type ShopItemId,
} from "../../shared/game";
import { ConfettiBurst } from "../components/ConfettiBurst";
import {
  COLOR_BY_ID,
  ColorPeg,
  MastermindAttemptRow,
} from "../components/GameReplay";
import {
  Button,
  Panel,
  ProgressStrip,
  SectionKicker,
} from "../components/ui";

function AnswerReveal({ answer }: { answer: MastermindColorId[] }) {
  if (!answer.length) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-orange/50 bg-warning-muted p-3">
      <p className="text-sm font-bold text-subtle-foreground">Code secret</p>
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

function statusText(game: MastermindGameState, pendingGuess: boolean): ReactNode {
  const remaining = game.maxAttempts - game.attempts.length;

  if (pendingGuess) {
    return "Analyse du code...";
  }
  if (game.solved) {
    const attempt = game.attempts.find((item) => item.solved);
    return (
      <span className="inline-flex flex-wrap items-center justify-center gap-1.5">
        Code trouvé en {attempt?.attemptNumber ?? 0} essais. Score:
        <span className="font-mono font-black tabular-nums">
          {(attempt?.score ?? 0).toLocaleString("fr-FR")}
        </span>
      </span>
    );
  }
  if (game.over) {
    return "Manche terminée. Le code secret est affiché.";
  }
  return `${remaining} ${remaining > 1 ? "essais restants" : "essai restant"}.`;
}

export function MastermindPage({
  abandonRound,
  addColor,
  authLoading = false,
  canSubmit,
  celebrationKey,
  confettiSkin,
  clearGuess,
  game,
  guess,
  isAbandoning,
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
  abandonRound: () => void | Promise<void>;
  addColor: (color: MastermindColorId) => void;
  authLoading?: boolean;
  canSubmit: boolean;
  celebrationKey?: string;
  confettiSkin?: ShopItemId;
  clearGuess: () => void;
  game?: MastermindGameState;
  guess: MastermindColorId[];
  isAbandoning: boolean;
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
  void authLoading;
  void onSignIn;

  if (!game) {
    return null;
  }

  if (game.status === "idle") {
    return (
      <div className="mx-auto flex min-h-[inherit] max-w-2xl flex-col items-center justify-center px-4 py-10 text-center">
        <Panel className="w-full space-y-5">
          <SectionKicker>Mastermind</SectionKicker>
          <h2 className="text-4xl font-black">Casse le code couleur.</h2>
          <p className="text-subtle-foreground">
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
      <ConfettiBurst burstKey={celebrationKey} skin={confettiSkin} />

      <section className="mx-auto w-full max-w-xl space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionKicker>Mastermind</SectionKicker>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-subtle-foreground">
              Manche #{game.gamesPlayed} · jusqu'à
              <span className="font-mono font-black tabular-nums">560 pts</span>
            </p>
            {!signedIn ? (
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                Invité: cette manche ne compte pas au classement.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {!game.over ? (
              <Button
                disabled={isAbandoning || pendingGuess}
                size="sm"
                type="button"
                variant="warning"
                onClick={abandonRound}
              >
                {isAbandoning ? "Abandon..." : "Abandonner"}
              </Button>
            ) : null}
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
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
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
              <MastermindAttemptRow attempt={attempt} key={attempt.id} />
            ))
          ) : (
            <div className="rounded-md border border-dashed border-input p-5 text-center text-sm text-muted-foreground">
              Aucune proposition pour le moment.
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <Panel className="space-y-4">
          <div>
            <SectionKicker>Proposition</SectionKicker>
            <p className="mt-2 text-sm text-muted-foreground">
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
                  className="grid h-12 place-items-center rounded-md border border-input bg-muted transition hover:border-foreground/60"
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

          <p className="min-h-6 text-center text-sm font-semibold text-subtle-foreground">
            {localError || statusText(game, pendingGuess)}
          </p>
        </Panel>

        <AnswerReveal answer={game.over ? game.answer : []} />
      </aside>
    </div>
  );
}
