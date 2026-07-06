import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  shopItemById,
  type FriendshipStatus,
  type ProfileRecentGame,
  type PublicPlayerProfile,
  type ShopEquipSlot,
  type ShopItemId,
} from "../../shared/game";
import { AuthRequired } from "../components/AuthRequired";
import { AvatarDisplay } from "../components/AvatarDisplay";
import {
  Button,
  Panel,
  PointsAmount,
  SectionKicker,
  Skeleton,
} from "../components/ui";
import { apiJson } from "../lib/api";
import { requestPlayerFriend, usePublicPlayerProfile } from "../game/use-players";

const MODE_LABELS: Record<ProfileRecentGame["mode"], string> = {
  daily: "Mot du jour",
  endless: "Mode libre",
  mastermind: "Mastermind",
};

const STATUS_LABELS: Record<ProfileRecentGame["status"], string> = {
  solved: "Gagnée",
  failed: "Perdue",
  abandoned: "Abandonnée",
  active: "En cours",
};

const FRIEND_COPY: Record<FriendshipStatus, string> = {
  self: "Ton profil",
  friend: "Ami",
  incoming: "Demande reçue",
  outgoing: "Demande envoyée",
  none: "Ajouter",
};

const SLOT_LABELS: Record<ShopEquipSlot, string> = {
  avatar: "Avatar",
  hat: "Chapeau",
  shirt: "T-shirt",
  confetti: "Confettis",
  theme: "Theme",
};

function formatDate(value: string): string {
  if (!value) {
    return "Jamais";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function PublicStat({
  label,
  points = false,
  value,
}: {
  label: string;
  points?: boolean;
  value: number | string;
}) {
  const compactText = typeof value === "string" && value.length > 8;

  return (
    <div className="rounded-lg bg-muted p-4">
      {points ? (
        <PointsAmount className="text-3xl font-black" iconClassName="size-7" value={value} />
      ) : (
        <p className={`font-mono font-black tabular-nums ${compactText ? "text-lg" : "text-3xl"}`}>
          {value}
        </p>
      )}
      <p className="mt-1 text-sm font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

function FriendAction({
  player,
  refetch,
}: {
  player: PublicPlayerProfile;
  refetch: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function requestFriend() {
    setBusy(true);
    setMessage("");
    try {
      await requestPlayerFriend(player.userId);
      setMessage("Demande envoyée.");
      await refetch();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Demande impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function removeFriend() {
    setBusy(true);
    setMessage("");
    try {
      await apiJson("/api/friends/remove", {
        method: "POST",
        body: JSON.stringify({ targetUserId: player.userId }),
      });
      setMessage("Amitié retirée.");
      await refetch();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (player.friendshipStatus === "self") {
    return (
      <Link
        className="inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 text-sm font-bold uppercase tracking-wide text-secondary-foreground transition-[background-color,scale] hover:bg-secondary-hover active:scale-[0.96]"
        to="/profile"
      >
        Ouvrir mon profil
      </Link>
    );
  }

  return (
    <div className="grid gap-2">
      {player.friendshipStatus === "friend" ? (
        <Button disabled={busy} type="button" variant="secondary" onClick={() => void removeFriend()}>
          {busy ? "Mise à jour..." : "Retirer l'ami"}
        </Button>
      ) : player.friendshipStatus === "none" ? (
        <Button disabled={busy} type="button" variant="success" onClick={() => void requestFriend()}>
          {busy ? "Envoi..." : "Envoyer une demande"}
        </Button>
      ) : (
        <Button disabled type="button" variant="secondary">
          {FRIEND_COPY[player.friendshipStatus]}
        </Button>
      )}
      {message ? <p className="text-sm font-semibold text-subtle-foreground">{message}</p> : null}
    </div>
  );
}

function PublicInventory({ player }: { player: PublicPlayerProfile }) {
  const equipped = Object.entries(player.inventory.equipped) as Array<[ShopEquipSlot, ShopItemId]>;

  return (
    <Panel className="space-y-4">
      <div>
        <SectionKicker>Inventaire</SectionKicker>
        <h3 className="mt-2 text-2xl font-black">
          {player.inventory.ownedCount}/{player.inventory.totalItems} objets
        </h3>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {equipped.map(([slot, itemId]) => (
          <div className="rounded-md bg-muted p-3" key={slot}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {SLOT_LABELS[slot]}
            </p>
            <p className="mt-1 truncate text-sm font-black">
              {shopItemById(itemId)?.name ?? "Aucun"}
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PublicRecentGames({ games }: { games: ProfileRecentGame[] }) {
  return (
    <Panel className="space-y-4">
      <div>
        <SectionKicker>Parties</SectionKicker>
        <h3 className="mt-2 text-2xl font-black">Dernières parties</h3>
      </div>
      {games.length === 0 ? (
        <p className="rounded-md bg-muted p-4 text-sm font-semibold text-muted-foreground">
          Aucune partie récente.
        </p>
      ) : (
        <div className="grid gap-2">
          {games.map((game) => (
            <div className="grid gap-2 rounded-md bg-muted p-3 sm:grid-cols-[1fr_auto] sm:items-center" key={`${game.mode}:${game.id}`}>
              <div>
                <p className="font-black">{MODE_LABELS[game.mode]}</p>
                <p className="text-sm font-semibold text-muted-foreground">
                  {STATUS_LABELS[game.status]} · {game.attemptCount} essais · {formatDate(game.updatedAt)}
                </p>
              </div>
              <PointsAmount className="justify-start text-xl font-black sm:justify-end" value={game.score} />
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function PlayerProfilePage({
  authLoading = false,
  signedIn,
}: {
  authLoading?: boolean;
  signedIn: boolean;
}) {
  const { playerId } = useParams();
  const profile = usePublicPlayerProfile(playerId, signedIn);
  const player = profile.data;

  if (!signedIn) {
    return (
      <AuthRequired
        loading={authLoading}
        title={authLoading ? "Verification de ta session." : "Connecte-toi pour voir ce profil."}
        description="Les profils publics utilisent les pseudos et avatars Smotu."
        eyebrow="Joueur"
      />
    );
  }

  return (
    <div className="mx-auto grid min-h-[inherit] max-w-6xl gap-6 px-4 py-8 xl:grid-cols-[360px_1fr]">
      <aside className="space-y-4">
        <Panel className="space-y-5">
          {profile.loading ? (
            <>
              <Skeleton className="h-24" />
              <Skeleton className="h-10" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <AvatarDisplay avatar={player.publicAvatar} label={`Avatar de ${player.userName}`} size="lg" />
                <div className="min-w-0">
                  <SectionKicker>Profil public</SectionKicker>
                  <h2 className="mt-1 truncate text-3xl font-black">{player.userName}</h2>
                  <p className="mt-1 truncate font-mono text-xs font-semibold text-muted-foreground">
                    {player.userId}
                  </p>
                </div>
              </div>
              <FriendAction player={player} refetch={profile.refetch} />
            </>
          )}
        </Panel>
      </aside>

      <section className="space-y-5">
        {profile.loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <PublicStat label="Score total" points value={player.totalScore} />
              <PublicStat label="Rang" value={player.rank ? `#${player.rank}` : "Non classé"} />
              <PublicStat label="Victoires" value={player.gamesSolved} />
              <PublicStat label="Dernier score" value={formatDate(player.lastScoredAt)} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <PublicStat label="Mot du jour" points value={player.dailyScore} />
              <PublicStat label="Mode libre" points value={player.endlessScore} />
              <PublicStat label="Mastermind" points value={player.mastermindScore} />
            </div>
            <PublicInventory player={player} />
            <PublicRecentGames games={player.recentGames} />
          </>
        )}
      </section>
    </div>
  );
}
