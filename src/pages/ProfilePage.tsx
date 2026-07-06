import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  type FriendProfile,
  type FriendRequest,
  type ProfileRecentGame,
  type ProfileStats,
} from "../../shared/game";
import { AuthRequired } from "../components/AuthRequired";
import { AvatarDisplay } from "../components/AvatarDisplay";
import {
  Button,
  Input,
  Modal,
  Panel,
  PointsAmount,
  SectionKicker,
  Skeleton,
} from "../components/ui";
import { useFriends } from "../game/use-friends";
import { apiJson } from "../lib/api";
import type { AuthUser } from "../lib/auth";

const MODE_LABELS: Record<ProfileRecentGame["mode"], string> = {
  daily: "Mot du jour",
  endless: "Mode libre",
  mastermind: "Mastermind",
};

const STATUS_LABELS: Record<ProfileRecentGame["status"], string> = {
  solved: "Gagnee",
  failed: "Perdue",
  abandoned: "Abandonnee",
  active: "En cours",
};

function displayName(stats: ProfileStats): string {
  return stats.userName || "Joueur Smotu";
}

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

function StatBox({
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
        <PointsAmount
          className="text-3xl font-black"
          iconClassName="size-7"
          value={value}
        />
      ) : (
        <p className={`font-mono font-black tabular-nums ${compactText ? "text-lg" : "text-3xl"}`}>
          {value}
        </p>
      )}
      <p className="mt-1 text-sm font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

function UsernameForm({
  currentName,
  onSaved,
}: {
  currentName: string;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const trimmedValue = value.trim();
  const unchanged = trimmedValue === currentName.trim();

  useEffect(() => {
    setValue(currentName);
  }, [currentName]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!trimmedValue || unchanged) {
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await apiJson("/api/profile/username", {
        method: "POST",
        body: JSON.stringify({ username: trimmedValue }),
      });
      setEditing(false);
      setMessage("Pseudo mis a jour.");
      onSaved();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="grid gap-3">
        <div>
          <SectionKicker>Pseudo public</SectionKicker>
          <p className="mt-1 truncate text-xl font-black">{currentName}</p>
        </div>
        <Button size="sm" type="button" variant="secondary" onClick={() => setEditing(true)}>
          Modifier
        </Button>
        {message ? <p className="text-sm font-semibold text-success">{message}</p> : null}
      </div>
    );
  }

  return (
    <form className="grid gap-3" onSubmit={save}>
      <label className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground" htmlFor="username">
        Nouveau pseudo
      </label>
      <Input
        className="normal-case"
        id="username"
        maxLength={20}
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <Button disabled={saving || !trimmedValue || unchanged} size="sm" type="submit" variant="success">
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
        <Button
          disabled={saving}
          size="sm"
          type="button"
          variant="ghost"
          onClick={() => {
            setValue(currentName);
            setMessage("");
            setEditing(false);
          }}
        >
          Annuler
        </Button>
      </div>
      {message ? <p className="text-sm font-semibold text-destructive">{message}</p> : null}
    </form>
  );
}

function InventoryPanel({ stats }: { stats: ProfileStats }) {
  return (
    <Panel className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionKicker>Inventaire</SectionKicker>
          <h3 className="mt-2 text-2xl font-black">
            {stats.inventory.ownedCount}/{stats.inventory.totalItems} objets
          </h3>
        </div>
        <Link
          className="inline-flex h-10 items-center rounded-md bg-secondary px-3 text-sm font-bold uppercase tracking-wide text-secondary-foreground transition-[background-color,scale] hover:bg-secondary-hover active:scale-[0.96]"
          to="/inventory"
        >
          Gérer l'inventaire
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <AvatarDisplay avatar={stats.inventory.publicAvatar} label="Avatar équipé" size="lg" />
        <div className="grid flex-1 gap-2 sm:grid-cols-3">
          <StatBox label="Indices lettres" value={stats.inventory.consumables.hintLetter} />
          <StatBox label="Positions" value={stats.inventory.consumables.hintPosition} />
          <StatBox label="Mastermind" value={stats.inventory.consumables.hintMastermind} />
        </div>
      </div>
    </Panel>
  );
}

function RecentGameRow({ game }: { game: ProfileRecentGame }) {
  return (
    <div className="grid gap-3 rounded-md bg-muted p-3 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <p className="font-black">{MODE_LABELS[game.mode]}</p>
        <p className="text-sm font-semibold text-muted-foreground">
          {STATUS_LABELS[game.status]} · {game.attemptCount} essais · {formatDate(game.updatedAt)}
        </p>
      </div>
      <p className="justify-start font-mono text-xl font-black tabular-nums sm:justify-end sm:text-right">
        {game.score.toLocaleString("fr-FR")}
      </p>
    </div>
  );
}

function FullHistoryModal({
  onClose,
  open,
}: {
  onClose: () => void;
  open: boolean;
}) {
  const [games, setGames] = useState<ProfileRecentGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    setLoading(true);
    setError("");
    apiJson<ProfileRecentGame[]>("/api/profile/games?limit=200")
      .then((data) => {
        if (active) {
          setGames(data);
        }
      })
      .catch((reason) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Chargement impossible.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open]);

  return (
    <Modal open={open} title="Tout l'historique" onClose={onClose}>
      {loading ? (
        <div className="grid gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : error ? (
        <p className="rounded-md bg-muted p-4 text-sm font-semibold text-destructive">{error}</p>
      ) : games.length === 0 ? (
        <p className="rounded-md bg-muted p-4 text-sm font-semibold text-muted-foreground">
          Aucune partie terminee pour l'instant.
        </p>
      ) : (
        <div className="grid max-h-[60vh] gap-2 overflow-y-auto">
          {games.map((game) => (
            <RecentGameRow game={game} key={`${game.mode}:${game.id}`} />
          ))}
        </div>
      )}
    </Modal>
  );
}

function RecentGamesPanel({
  games,
  loading,
}: {
  games: ProfileRecentGame[];
  loading: boolean;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <Panel className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionKicker>Dernieres parties</SectionKicker>
          <h3 className="mt-2 text-2xl font-black">Historique recent</h3>
        </div>
        {games.length > 0 ? (
          <Button size="sm" type="button" variant="secondary" onClick={() => setHistoryOpen(true)}>
            Tout l'historique
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="grid gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : games.length === 0 ? (
        <p className="rounded-md bg-muted p-4 text-sm font-semibold text-muted-foreground">
          Aucune partie terminee pour l'instant.
        </p>
      ) : (
        <div className="grid gap-2">
          {games.map((game) => (
            <RecentGameRow game={game} key={`${game.mode}:${game.id}`} />
          ))}
        </div>
      )}

      <FullHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </Panel>
  );
}

function FriendCard({ friend }: { friend: FriendProfile }) {
  return (
    <Link
      className="flex items-center gap-3 rounded-md bg-muted p-3 transition-[background-color,scale] hover:bg-card-hover active:scale-[0.96]"
      to={`/players/${encodeURIComponent(friend.userId)}`}
    >
      <AvatarDisplay avatar={friend.publicAvatar} label={`Avatar de ${friend.userName}`} size="sm" />
      <div className="min-w-0">
        <p className="truncate font-black">{friend.userName}</p>
        <p className="truncate font-mono text-xs font-semibold text-muted-foreground">
          {friend.userId}
        </p>
      </div>
    </Link>
  );
}

function FriendRequestRow({
  request,
  respond,
}: {
  request: FriendRequest;
  respond: (requestId: string, accept: boolean) => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);

  async function submit(accept: boolean) {
    setBusy(true);
    try {
      await respond(request.id, accept);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-md bg-muted p-3 sm:grid-cols-[1fr_auto] sm:items-center">
      <FriendCard friend={request.user} />
      <div className="grid grid-cols-2 gap-2">
        <Button disabled={busy} size="sm" type="button" variant="success" onClick={() => void submit(true)}>
          Accepter
        </Button>
        <Button disabled={busy} size="sm" type="button" variant="ghost" onClick={() => void submit(false)}>
          Refuser
        </Button>
      </div>
    </div>
  );
}

function FriendsPanel({ signedIn }: { signedIn: boolean }) {
  const friends = useFriends(signedIn);

  return (
    <Panel className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionKicker>Amitiés</SectionKicker>
          <h3 className="mt-2 text-2xl font-black">
            {friends.data.friends.length} ami{friends.data.friends.length > 1 ? "s" : ""}
          </h3>
        </div>
        <Link
          className="inline-flex h-10 items-center rounded-md bg-primary px-3 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-[scale] active:scale-[0.96]"
          to="/players"
        >
          Rechercher
        </Link>
      </div>

      {friends.loading ? (
        <div className="grid gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (
        <>
          {friends.data.incomingRequests.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-black text-subtle-foreground">Demandes reçues</p>
              {friends.data.incomingRequests.map((request) => (
                <FriendRequestRow key={request.id} request={request} respond={friends.respond} />
              ))}
            </div>
          ) : null}

          {friends.data.friends.length === 0 ? (
            <p className="rounded-md bg-muted p-4 text-sm font-semibold text-muted-foreground">
              Aucun ami pour l'instant.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {friends.data.friends.map((friend) => (
                <FriendCard friend={friend} key={friend.userId} />
              ))}
            </div>
          )}

          {friends.data.outgoingRequests.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-black text-subtle-foreground">Demandes envoyees</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {friends.data.outgoingRequests.map((request) => (
                  <FriendCard friend={request.user} key={request.id} />
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </Panel>
  );
}

function AccountPanel({
  onSignOut,
  refetch,
  stats,
}: {
  onSignOut: () => void | Promise<void>;
  refetch?: () => void;
  stats: ProfileStats;
}) {
  return (
    <Panel className="space-y-4">
      <div>
        <SectionKicker>Compte</SectionKicker>
        <h3 className="mt-2 text-2xl font-black">Parametres</h3>
      </div>

      <UsernameForm currentName={stats.userName} onSaved={() => refetch?.()} />

      <div className="rounded-md bg-muted p-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Identifiant public
        </p>
        <p className="mt-1 break-all font-mono text-sm font-black">{stats.userId}</p>
      </div>

      <Button className="w-full" type="button" variant="secondary" onClick={() => void onSignOut()}>
        Se deconnecter
      </Button>
    </Panel>
  );
}

export function ProfilePage({
  authLoading = false,
  loading,
  onSignIn,
  onSignOut,
  refetch,
  stats,
  signedIn,
}: {
  authLoading?: boolean;
  loading: boolean;
  onSignIn: () => void | Promise<void>;
  onSignOut: () => void | Promise<void>;
  refetch?: () => void;
  stats: ProfileStats;
  signedIn: boolean;
  user?: AuthUser;
}) {
  if (!signedIn) {
    return (
      <AuthRequired
        loading={authLoading}
        title={authLoading ? "Verification de ta session." : "Connecte-toi pour voir ton profil."}
        description="Ton profil regroupe ton compte, ton score global et ton inventaire."
        eyebrow="Profil"
      />
    );
  }

  const name = displayName(stats);
  const rank = stats.rank ? `#${stats.rank}` : "Non classe";

  return (
    <div className="mx-auto grid min-h-[inherit] max-w-6xl gap-6 px-4 py-8 xl:grid-cols-[360px_1fr]">
      <aside className="space-y-4">
        <Panel className="space-y-5">
          <div className="flex items-center gap-4">
            <AvatarDisplay avatar={stats.publicAvatar} label={`Avatar de ${name}`} size="lg" />
            <div className="min-w-0">
              <SectionKicker>Profil</SectionKicker>
              <h2 className="mt-1 truncate text-3xl font-black">{name}</h2>
              <p className="mt-1 truncate font-mono text-xs font-semibold text-muted-foreground">
                {stats.userId}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <StatBox label="Score total" value={stats.totalScore.toLocaleString("fr-FR")} />
            <StatBox label="Solde" points value={stats.inventory.balance} />
            <StatBox label="Rang" value={rank} />
            <StatBox label="Victoires" value={stats.gamesSolved} />
            <StatBox label="Dernier score" value={formatDate(stats.lastScoredAt)} />
          </div>
        </Panel>

        <AccountPanel onSignOut={onSignOut} refetch={refetch} stats={stats} />
      </aside>

      <section className="space-y-5">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <StatBox label={`${stats.dailySolved} victoires quotidiennes`} value={stats.dailyScore.toLocaleString("fr-FR")} />
            <StatBox label={`${stats.endlessSolved} victoires libres`} value={stats.endlessScore.toLocaleString("fr-FR")} />
            <StatBox label={`${stats.mastermindSolved} victoires Mastermind`} value={stats.mastermindScore.toLocaleString("fr-FR")} />
          </div>
        )}

        <InventoryPanel stats={stats} />
        <RecentGamesPanel games={stats.recentGames} loading={loading} />
        <FriendsPanel signedIn={signedIn} />
      </section>
    </div>
  );
}
