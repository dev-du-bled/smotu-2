import { useState } from "react";
import { Link } from "react-router-dom";
import type { FriendshipStatus, PlayerSearchResult } from "../../shared/game";
import { AuthRequired } from "../components/AuthRequired";
import { AvatarDisplay } from "../components/AvatarDisplay";
import {
  Button,
  Input,
  Panel,
  SectionKicker,
  Skeleton,
} from "../components/ui";
import { requestPlayerFriend, usePlayerSearch } from "../game/use-players";

const STATUS_COPY: Record<FriendshipStatus, string> = {
  self: "Toi",
  friend: "Ami",
  incoming: "Demande reçue",
  outgoing: "Envoyée",
  none: "Aucun lien",
};

function PlayerResultCard({
  player,
  onError,
  onRequested,
}: {
  player: PlayerSearchResult;
  onError: (message: string) => void;
  onRequested: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const canRequest = player.friendshipStatus === "none";

  async function requestFriend() {
    setBusy(true);
    try {
      await requestPlayerFriend(player.userId);
      onRequested();
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : "Demande impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <AvatarDisplay avatar={player.publicAvatar} label={`Avatar de ${player.userName}`} size="md" />
      <div className="min-w-0">
        <Link
          className="text-2xl font-black transition-colors hover:text-primary"
          to={`/players/${encodeURIComponent(player.userId)}`}
        >
          {player.userName}
        </Link>
        <p className="mt-1 truncate font-mono text-xs font-semibold text-muted-foreground">
          {player.userId}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold text-subtle-foreground">
          <span className="rounded-md bg-muted px-2 py-1">
            Rang {player.rank ? `#${player.rank}` : "non classé"}
          </span>
          <span className="rounded-md bg-muted px-2 py-1">
            {player.gamesSolved} victoires
          </span>
          <span className="rounded-md bg-muted px-2 py-1">
            {STATUS_COPY[player.friendshipStatus]}
          </span>
        </div>
      </div>
      <div className="grid gap-2 sm:min-w-36">
        <p className="justify-start font-mono text-2xl font-black tabular-nums sm:justify-end sm:text-right">
          {player.totalScore.toLocaleString("fr-FR")}
        </p>
        {canRequest ? (
          <Button disabled={busy} size="sm" type="button" variant="success" onClick={() => void requestFriend()}>
            {busy ? "Envoi..." : "Demander"}
          </Button>
        ) : (
          <Button disabled size="sm" type="button" variant="secondary">
            {STATUS_COPY[player.friendshipStatus]}
          </Button>
        )}
      </div>
    </Panel>
  );
}

export function PlayersPage({
  authLoading = false,
  signedIn,
}: {
  authLoading?: boolean;
  signedIn: boolean;
}) {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const search = usePlayerSearch(query, signedIn);

  if (!signedIn) {
    return (
      <AuthRequired
        loading={authLoading}
        title={authLoading ? "Verification de ta session." : "Connecte-toi pour chercher des joueurs."}
        description="La recherche utilise les pseudos publics Smotu."
        eyebrow="Joueurs"
      />
    );
  }

  return (
    <div className="mx-auto min-h-[inherit] max-w-5xl space-y-6 px-4 py-8">
      <section>
        <SectionKicker>Joueurs</SectionKicker>
        <h2 className="mt-2 text-balance text-4xl font-black">Recherche de profils</h2>
        <p className="mt-3 max-w-2xl text-pretty text-subtle-foreground">
          Cherche un pseudo, ouvre son profil public ou envoie une demande d'ami.
        </p>
      </section>

      <Panel className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input
          className="normal-case"
          placeholder="Pseudo"
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            setMessage("");
          }}
        />
        <Button type="button" variant="secondary" onClick={() => void search.refetch()}>
          Rechercher
        </Button>
      </Panel>

      {message ? (
        <p className="rounded-md bg-card p-3 text-sm font-semibold text-subtle-foreground">
          {message}
        </p>
      ) : null}

      <section className="space-y-3">
        {search.loading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : search.data.length === 0 ? (
          <Panel>
            <p className="text-sm font-semibold text-muted-foreground">
              Aucun joueur trouvé.
            </p>
          </Panel>
        ) : (
          search.data.map((player) => (
            <PlayerResultCard
              key={player.userId}
              player={player}
              onRequested={() => {
                setMessage("Demande envoyée.");
                void search.refetch();
              }}
              onError={setMessage}
            />
          ))
        )}
      </section>
    </div>
  );
}
