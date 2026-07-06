import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthRequired } from "../components/AuthRequired";
import {
  Button,
  Input,
  Panel,
  SectionKicker,
  Skeleton,
} from "../components/ui";
import {
  ColorPeg,
  MastermindBoard,
  WordBoard,
} from "../components/GameReplay";
import { apiJson, clearApiCache } from "../lib/api";
import { authClient } from "../lib/auth";
import {
  type AdminUserGame,
  type AdminUserGamesData,
} from "../../shared/game";

type AdminOverview = {
  currentUser: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  currentSession: {
    id: string;
    token: string;
  };
  today: {
    dateKey: string;
    word: string;
    wordLength: number;
  };
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  image?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | string | null;
};

type ListUsersData = {
  users: AdminUser[];
  total: number;
  limit?: number;
  offset?: number;
};

type AdminSession = {
  id: string;
  token: string;
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  expiresAt: Date | string;
  ipAddress?: string | null;
  userAgent?: string | null;
  impersonatedBy?: string | null;
};

type ListUserSessionsData = {
  sessions: AdminSession[];
};

// authUserId -> pseudo Smotu choisi par l'utilisateur (peut différer du nom Google).
type AdminUsernamesData = {
  names: Record<string, string>;
};

const PAGE_SIZE = 20;

function formatDate(value: Date | string | null | undefined): string {
  if (!value) {
    return "Jamais";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function userRole(user: AdminUser): "admin" | "user" {
  return user.role === "admin" ? "admin" : "user";
}

function roleClass(role: "admin" | "user"): string {
  return role === "admin"
    ? "bg-purple text-purple-foreground"
    : "bg-success text-success-foreground";
}

function errorMessage(value: unknown): string {
  if (value instanceof Error) {
    return value.message;
  }
  return "Action impossible.";
}

const MODE_LABELS: Record<AdminUserGame["mode"], string> = {
  daily: "Quotidien",
  endless: "Libre",
  mastermind: "Mastermind",
};

const STATUS_LABELS: Record<AdminUserGame["status"], string> = {
  solved: "Résolu",
  failed: "Échoué",
  abandoned: "Abandonné",
  active: "En cours",
};

const STATUS_CLASS: Record<AdminUserGame["status"], string> = {
  solved: "bg-success text-success-foreground",
  failed: "bg-destructive text-destructive-foreground",
  abandoned: "bg-warning text-warning-foreground",
  active: "bg-muted-strong text-foreground",
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds <= 0) {
    return "—";
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${seconds} s`;
  }
  return `${minutes} min ${seconds.toString().padStart(2, "0")} s`;
}

function GameCard({ game }: { game: AdminUserGame }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-md border border-border bg-muted">
      <button
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="rounded-md bg-card px-2 py-1 text-xs font-black uppercase tracking-wide">
          {MODE_LABELS[game.mode]}
        </span>
        <span className="font-mono text-lg font-black uppercase tracking-wide">
          {game.mode === "mastermind" ? (
            <span className="inline-flex gap-1.5 align-middle">
              {(game.answerColors ?? []).map((color, index) => (
                <ColorPeg color={color} key={index} size="sm" />
              ))}
            </span>
          ) : (
            game.answer
          )}
        </span>
        <span
          className={`rounded-md px-2 py-1 text-xs font-black uppercase ${STATUS_CLASS[game.status]}`}
        >
          {STATUS_LABELS[game.status]}
        </span>
        <span className="text-sm font-semibold text-muted-foreground">
          {game.attemptCount} / {game.maxAttempts} essais
        </span>
        <span className="text-sm font-semibold text-muted-foreground">
          {formatDuration(game.durationMs)}
        </span>
        <span
          className={`ml-auto font-mono text-sm font-black tabular-nums ${
            game.score > 0
              ? "text-success"
              : game.score < 0
                ? "text-destructive"
                : "text-muted-foreground"
          }`}
        >
          {game.score.toLocaleString("fr-FR")}
        </span>
        <span className="text-xs font-bold text-muted-foreground">
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-border px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground">
            {formatDate(game.createdAt)}
          </p>
          {game.mode === "mastermind" ? (
            <MastermindBoard attempts={game.mastermindAttempts ?? []} />
          ) : (
            <div className="max-w-[220px]">
              <WordBoard
                attempts={game.attempts}
                maxAttempts={game.maxAttempts}
                wordLength={game.answer.length || 5}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  loading,
  value,
}: {
  label: string;
  loading?: boolean;
  value: string | number;
}) {
  return (
    <div className="rounded-md bg-muted p-4">
      {loading ? (
        <Skeleton className="h-8 w-28" />
      ) : (
        <p className="font-mono text-3xl font-black">{value}</p>
      )}
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function AdminPage({
  authLoading,
  signedIn,
}: {
  authLoading: boolean;
  signedIn: boolean;
}) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [overviewError, setOverviewError] = useState("");
  const [overviewLoading, setOverviewLoading] = useState(signedIn);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [actionId, setActionId] = useState("");
  const [message, setMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState("");
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});
  const [games, setGames] = useState<AdminUserGame[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gamesError, setGamesError] = useState("");

  const isAdmin = Boolean(overview);
  // L'admin peut lire les comptes auth, mais l'identité publique reste le pseudo Smotu.
  const displayName = (user: AdminUser) => profileNames[user.id] ?? user.name;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrevious = offset > 0;
  const canNext = offset + PAGE_SIZE < total;
  const selectedUser = users.find((user) => user.id === selectedUserId);
  const selectedRole = selectedUser ? userRole(selectedUser) : "user";
  const selectedIsSelf = selectedUser?.id === overview?.currentUser.id;

  const loadUsers = useCallback(
    async (nextOffset = offset, nextSearch = search) => {
      if (!isAdmin) {
        return;
      }

      setUsersLoading(true);
      setUsersError("");

      try {
        const trimmedSearch = nextSearch.trim();
        const response = await authClient.admin.listUsers({
          query: {
            limit: PAGE_SIZE,
            offset: nextOffset,
            searchValue: trimmedSearch || undefined,
            searchField: "email",
            searchOperator: "contains",
            sortBy: "createdAt",
            sortDirection: "desc",
          },
        });
        if (response.error) {
          throw new Error(response.error.message || "Chargement impossible.");
        }

        const data = response.data as ListUsersData;
        setUsers(data.users);
        setTotal(data.total);
        setOffset(Number(data.offset ?? nextOffset));
        if (
          selectedUserId &&
          !data.users.some((user) => user.id === selectedUserId)
        ) {
          setSelectedUserId("");
          setSessions([]);
        }

        const ids = data.users.map((user) => user.id).filter(Boolean);
        if (ids.length > 0) {
          try {
            const nameData = await apiJson<AdminUsernamesData>(
              `/api/admin/usernames?ids=${ids
                .map((id) => encodeURIComponent(id))
                .join(",")}`,
            );
            setProfileNames((previous) => ({ ...previous, ...nameData.names }));
          } catch {
            // Non bloquant : on retombe sur le nom du compte auth dans le panel admin.
          }
        }
      } catch (reason) {
        setUsersError(errorMessage(reason));
      } finally {
        setUsersLoading(false);
      }
    },
    [isAdmin, offset, search, selectedUserId],
  );

  const loadSessions = useCallback(async (user = selectedUser) => {
    if (!user) {
      setSessions([]);
      return;
    }

    setSessionsLoading(true);
    setSessionsError("");

    try {
      const response = await authClient.admin.listUserSessions({
        userId: user.id,
      });
      if (response.error) {
        throw new Error(response.error.message || "Chargement impossible.");
      }
      const data = response.data as ListUserSessionsData;
      setSessions(data.sessions);
    } catch (reason) {
      setSessionsError(errorMessage(reason));
    } finally {
      setSessionsLoading(false);
    }
  }, [selectedUser]);

  const loadGames = useCallback(async (user = selectedUser) => {
    if (!user) {
      setGames([]);
      return;
    }

    setGamesLoading(true);
    setGamesError("");

    try {
      const data = await apiJson<AdminUserGamesData>(
        `/api/admin/user-games?userId=${encodeURIComponent(user.id)}`,
      );
      setGames(data.games);
    } catch (reason) {
      setGamesError(errorMessage(reason));
    } finally {
      setGamesLoading(false);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!signedIn) {
      setOverview(null);
      setOverviewError("");
      setOverviewLoading(false);
      return;
    }

    let active = true;
    setOverviewLoading(true);
    setOverviewError("");

    apiJson<AdminOverview>("/api/admin/overview")
      .then((data) => {
        if (active) {
          setOverview(data);
        }
      })
      .catch((reason) => {
        if (active) {
          setOverview(null);
          setOverviewError(errorMessage(reason));
        }
      })
      .finally(() => {
        if (active) {
          setOverviewLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [signedIn]);

  useEffect(() => {
    if (isAdmin) {
      void loadUsers(0, search);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedUser) {
      void loadSessions(selectedUser);
      void loadGames(selectedUser);
    } else {
      setGames([]);
      setGamesError("");
    }
  }, [selectedUserId]);

  const visibleUsers = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        roleLabel: userRole(user),
      })),
    [users],
  );

  async function runAction(
    user: AdminUser,
    label: string,
    action: () => Promise<unknown>,
    options: { redirectToAuth?: boolean } = {},
  ) {
    setActionId(`${label}:${user.id}`);
    setMessage("");

    try {
      await action();
      if (options.redirectToAuth) {
        clearApiCache();
        window.location.assign("/auth");
        return;
      }
      setMessage(`${label} effectue.`);
      await loadUsers();
      if (label !== "Suppression") {
        await loadSessions(user);
      }
    } catch (reason) {
      setMessage(errorMessage(reason));
    } finally {
      setActionId("");
    }
  }

  if (!signedIn) {
    return (
      <AuthRequired
        loading={authLoading}
        title="Connecte-toi pour acceder au panel admin."
        description="Le panel est reserve aux comptes qui ont le role admin."
        eyebrow="Admin"
      />
    );
  }

  if (overviewLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Panel>
          <SectionKicker>Admin</SectionKicker>
          <h2 className="mt-2 text-3xl font-black">Acces refuse</h2>
          <p className="mt-2 text-subtle-foreground">
            {overviewError || "Ton compte n'a pas le role admin."}
          </p>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 xl:grid-cols-[1fr_320px]">
      <section className="min-w-0 space-y-6">
        <div>
          <SectionKicker>Admin</SectionKicker>
          <h2 className="mt-2 text-4xl font-black">Panel Smotu</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Mot du jour" value={overview.today.word} />
          <Stat label="Date" value={overview.today.dateKey} />
          <Stat label="Utilisateurs" loading={usersLoading} value={total} />
        </div>

        <Panel className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <SectionKicker>Utilisateurs</SectionKicker>
              <h3 className="mt-2 text-2xl font-black">Gestion des comptes</h3>
            </div>
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void loadUsers(0, search);
              }}
            >
              <Input
                className="h-10 w-full text-base font-semibold normal-case md:w-72"
                placeholder="Chercher par email"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
              />
              <Button disabled={usersLoading} size="sm" type="submit">
                Chercher
              </Button>
            </form>
          </div>

          {usersError ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-semibold text-destructive">
              {usersError}
            </p>
          ) : null}

          <div>
            <table className="w-full table-auto border-separate border-spacing-y-2 text-left">
              <thead className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Compte</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Statut</th>
                  <th className="px-3 py-2">Creation</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td className="rounded-l-md bg-muted px-3 py-4" colSpan={4}>
                        <Skeleton className="h-5 w-full" />
                      </td>
                    </tr>
                  ))
                ) : visibleUsers.length === 0 ? (
                  <tr>
                    <td
                      className="rounded-md bg-muted px-3 py-8 text-center text-sm font-semibold text-muted-foreground"
                      colSpan={4}
                    >
                      Aucun utilisateur.
                    </td>
                  </tr>
                ) : (
                  visibleUsers.map((user) => {
                    const selected = user.id === selectedUserId;
                    const cellClass = selected
                      ? "bg-primary/15"
                      : "bg-muted transition group-hover:bg-card-hover";

                    return (
                      <tr
                        className="group cursor-pointer outline-none"
                        key={user.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedUserId(user.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedUserId(user.id);
                          }
                        }}
                      >
                        <td className={`rounded-l-md px-3 py-3 ${cellClass}`}>
                          <p className="font-black">{displayName(user)}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </td>
                        <td className={`px-3 py-3 ${cellClass}`}>
                          <span className={`rounded-md px-2 py-1 text-xs font-black uppercase ${roleClass(user.roleLabel)}`}>
                            {user.roleLabel}
                          </span>
                        </td>
                        <td className={`px-3 py-3 ${cellClass}`}>
                          <p className="text-sm font-bold">
                            {user.banned ? "Banni" : "Actif"}
                          </p>
                          {user.banReason ? (
                            <p className="text-xs text-muted-foreground">
                              {user.banReason}
                            </p>
                          ) : null}
                        </td>
                        <td className={`rounded-r-md px-3 py-3 text-sm text-muted-foreground ${cellClass}`}>
                          {formatDate(user.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-muted-foreground">
              Page {page} / {pageCount}
            </p>
            <div className="flex gap-2">
              <Button
                disabled={!canPrevious || usersLoading}
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => void loadUsers(Math.max(0, offset - PAGE_SIZE))}
              >
                Precedent
              </Button>
              <Button
                disabled={!canNext || usersLoading}
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => void loadUsers(offset + PAGE_SIZE)}
              >
                Suivant
              </Button>
            </div>
          </div>

          {message ? (
            <p className="text-sm font-semibold text-muted-foreground">{message}</p>
          ) : null}
        </Panel>

        <Panel className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SectionKicker>Historique</SectionKicker>
              <h3 className="mt-2 text-2xl font-black">
                Dernières parties
                {selectedUser ? ` · ${selectedUser.name}` : ""}
              </h3>
            </div>
            {selectedUser ? (
              <Button
                disabled={gamesLoading}
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => void loadGames(selectedUser)}
              >
                Sync
              </Button>
            ) : null}
          </div>

          {!selectedUser ? (
            <p className="text-sm text-muted-foreground">
              Sélectionne un utilisateur pour voir ses dernières parties.
            </p>
          ) : gamesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : gamesError ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-semibold text-destructive">
              {gamesError}
            </p>
          ) : games.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune partie enregistrée pour cet utilisateur.
            </p>
          ) : (
            <div className="space-y-2">
              {games.map((game) => (
                <GameCard game={game} key={game.id} />
              ))}
            </div>
          )}
        </Panel>
      </section>

      <aside className="space-y-6">
        <Panel className="space-y-5">
          <div>
            <SectionKicker>Utilisateur</SectionKicker>
            <h3 className="mt-2 text-2xl font-black">
              {selectedUser ? displayName(selectedUser) : "Aucun utilisateur"}
            </h3>
            {selectedUser ? (
              <p className="mt-1 break-all text-sm text-muted-foreground">
                {selectedUser.email}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                Selectionne une ligne pour afficher les actions.
              </p>
            )}
          </div>

          {selectedUser ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Role
                  </p>
                  <span className={`mt-2 inline-flex rounded-md px-2 py-1 text-xs font-black uppercase ${roleClass(selectedRole)}`}>
                    {selectedRole}
                  </span>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Statut
                  </p>
                  <p className="mt-1 font-black">
                    {selectedUser.banned ? "Banni" : "Actif"}
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Button
                  disabled={Boolean(actionId) || selectedIsSelf}
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const nextRole = selectedRole === "admin" ? "user" : "admin";
                    void runAction(selectedUser, `Role ${nextRole}`, async () => {
                      const response = await authClient.admin.setRole({
                        userId: selectedUser.id,
                        role: nextRole,
                      });
                      if (response.error) {
                        throw new Error(response.error.message);
                      }
                    });
                  }}
                >
                  Passer {selectedRole === "admin" ? "user" : "admin"}
                </Button>
                <Button
                  disabled={Boolean(actionId) || selectedIsSelf}
                  type="button"
                  variant={selectedUser.banned ? "success" : "warning"}
                  onClick={() =>
                    void runAction(
                      selectedUser,
                      selectedUser.banned ? "Deban" : "Ban",
                      async () => {
                        const response = selectedUser.banned
                          ? await authClient.admin.unbanUser({
                              userId: selectedUser.id,
                            })
                          : await authClient.admin.banUser({
                              userId: selectedUser.id,
                              banReason: "Banni depuis le panel admin",
                            });
                        if (response.error) {
                          throw new Error(response.error.message);
                        }
                      },
                    )
                  }
                >
                  {selectedUser.banned ? "Debannir" : "Bannir"}
                </Button>
                <Button
                  disabled={Boolean(actionId) || selectedIsSelf}
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Supprimer definitivement ${selectedUser.email} ?`,
                      )
                    ) {
                      void runAction(selectedUser, "Suppression", async () => {
                        const response = await authClient.admin.removeUser({
                          userId: selectedUser.id,
                        });
                        if (response.error) {
                          throw new Error(response.error.message);
                        }
                        setSelectedUserId("");
                        setSessions([]);
                      });
                    }
                  }}
                >
                  Supprimer
                </Button>
              </div>

              {selectedIsSelf ? (
                <p className="text-xs font-semibold text-muted-foreground">
                  Les actions destructives sont bloquees sur ton propre compte.
                </p>
              ) : null}
            </>
          ) : null}

          <div className="border-t border-border pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SectionKicker>Sessions</SectionKicker>
                <h4 className="mt-2 text-xl font-black">Connexions</h4>
              </div>
              <Button
                disabled={!selectedUser || sessionsLoading}
                size="sm"
                type="button"
                variant="secondary"
                onClick={() => void loadSessions()}
              >
                Sync
              </Button>
            </div>

            <div className="mt-4">
              {!selectedUser ? (
                <p className="text-sm text-muted-foreground">
                  Selectionne un utilisateur pour voir ses sessions.
                </p>
              ) : sessionsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : sessionsError ? (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm font-semibold text-destructive">
                  {sessionsError}
                </p>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune session active.
                </p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      className="rounded-md border border-border bg-muted p-3"
                      key={session.id}
                    >
                      {selectedIsSelf &&
                      (session.id === overview.currentSession.id ||
                        session.token === overview.currentSession.token) ? (
                        <span className="mb-2 inline-flex rounded-md bg-primary px-2 py-1 text-xs font-black uppercase text-primary-foreground">
                          Session actuelle
                        </span>
                      ) : null}
                      <p className="truncate font-mono text-xs font-black">
                        {session.id}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Expire le {formatDate(session.expiresAt)}
                      </p>
                      {session.ipAddress ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          IP: {session.ipAddress}
                        </p>
                      ) : null}
                      {session.userAgent ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {session.userAgent}
                        </p>
                      ) : null}
                      <Button
                        className="mt-3 w-full"
                        disabled={Boolean(actionId)}
                        size="sm"
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          void runAction(
                            selectedUser,
                            "Session revoquee",
                            async () => {
                              const response =
                                await authClient.admin.revokeUserSession({
                                  sessionToken: session.token,
                                });
                              if (response.error) {
                                throw new Error(response.error.message);
                              }
                            },
                            {
                              redirectToAuth:
                                selectedIsSelf &&
                                (session.id === overview.currentSession.id ||
                                  session.token === overview.currentSession.token),
                            },
                          )
                        }
                      >
                        Revoquer
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedUser && sessions.length > 0 ? (
            <Button
              className="w-full"
              disabled={Boolean(actionId) || selectedIsSelf}
              type="button"
              variant="warning"
              onClick={() => {
                if (window.confirm(`Revoquer toutes les sessions de ${selectedUser.email} ?`)) {
                  void runAction(selectedUser, "Sessions revoquees", async () => {
                    const response = await authClient.admin.revokeUserSessions({
                      userId: selectedUser.id,
                    });
                    if (response.error) {
                      throw new Error(response.error.message);
                    }
                  });
                }
              }}
            >
              Revoquer toutes les sessions
            </Button>
          ) : null}
        </Panel>
      </aside>
    </div>
  );
}
