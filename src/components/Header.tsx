import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import type { ShopItem, ShopItemId } from "../../shared/game";
import { SHOP_ITEMS } from "../../shared/game";
import { prefetchResource } from "../lib/api";
import { Button, Dropdown, LogoMark, PointsAmount, Skeleton } from "./ui";

// Thèmes du catalogue, triés pour le menu (theme-default toujours possédé).
const THEME_ITEMS: ShopItem[] = SHOP_ITEMS.filter(
  (item) => item.category === "theme",
).sort((a, b) => a.sortOrder - b.sortOrder);

type HoverHandlers = ReturnType<typeof usePrefetchOnHover>;

type HeaderProps = {
  isAdmin: boolean;
  loading: boolean;
  onSignIn: () => void | Promise<void>;
  onSignOut: () => void | Promise<void>;
  onThemeChange?: (itemId: ShopItemId) => void | Promise<void>;
  ownedThemeIds?: ShopItemId[];
  points: number;
  pointsLoading: boolean;
  signedIn: boolean;
  themeId?: ShopItemId;
};

// Précharge (débounce) la donnée d'une page au survol/focus d'un lien, pour que
// la navigation trouve un cache déjà chaud plutôt qu'un skeleton.
function usePrefetchOnHover(paths: readonly string[], enabled = true) {
  const timer = useRef<number | undefined>(undefined);
  const key = paths.join("|");

  const cancel = useCallback(() => {
    window.clearTimeout(timer.current);
  }, []);

  useEffect(() => cancel, [cancel]);

  const start = useCallback(() => {
    if (!enabled) {
      return;
    }
    cancel();
    timer.current = window.setTimeout(() => {
      for (const path of key.split("|")) {
        prefetchResource(path);
      }
    }, 120);
  }, [cancel, enabled, key]);

  return {
    onMouseEnter: start,
    onFocus: start,
    onMouseLeave: cancel,
    onBlur: cancel,
  };
}

function navClass(active: boolean, block = false): string {
  return `${block ? "block w-full" : ""} rounded-md px-3 py-2 text-sm font-bold transition ${
    active
      ? "bg-primary text-primary-foreground"
      : "text-subtle-foreground hover:bg-muted"
  }`;
}

function AuthAction({
  className = "",
  loading,
  onDone,
  onSignIn,
  onSignOut,
  onShowAuth,
  signedIn,
}: {
  className?: string;
  loading: boolean;
  onDone?: () => void;
  onSignIn: () => void | Promise<void>;
  onSignOut: () => void | Promise<void>;
  onShowAuth: () => void;
  signedIn: boolean;
}) {
  if (loading) {
    return <Skeleton className={`h-9 w-32 ${className}`} />;
  }

  if (signedIn) {
    return (
      <Button
        className={className}
        size="sm"
        type="button"
        variant="secondary"
        onClick={() => {
          onDone?.();
          void onSignOut();
        }}
      >
        Se déconnecter
      </Button>
    );
  }

  return (
    <Button
      className={className}
      size="sm"
      type="button"
      variant="secondary"
      onClick={() => {
        onDone?.();
        onShowAuth();
      }}
    >
      Se connecter
    </Button>
  );
}

function MenuLink({
  activeClass = "bg-primary text-primary-foreground",
  children,
  onSelect,
  prefetch,
  to,
}: {
  activeClass?: string;
  children: ReactNode;
  onSelect: () => void;
  prefetch?: HoverHandlers;
  to: string;
}) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <NavLink
      className={`block rounded-md px-3 py-2 text-sm font-bold transition ${
        active ? activeClass : "text-subtle-foreground hover:bg-muted"
      }`}
      role="menuitem"
      to={to}
      onClick={onSelect}
      {...prefetch}
    >
      {children}
    </NavLink>
  );
}

function GameModeDropdown() {
  const location = useLocation();
  const active =
    location.pathname === "/play" ||
    location.pathname === "/endless" ||
    location.pathname === "/timed" ||
    location.pathname === "/mastermind";

  return (
    <Dropdown
      className="grid w-52 gap-1"
      trigger="Jouer"
      triggerClassName={navClass(active)}
    >
      {(close) => (
        <>
          <MenuLink
            activeClass="bg-success text-success-foreground"
            to="/play"
            onSelect={close}
          >
            Mot du jour
          </MenuLink>
          <MenuLink
            activeClass="bg-warning text-warning-foreground"
            to="/endless"
            onSelect={close}
          >
            Mode libre
          </MenuLink>
          <MenuLink
            activeClass="bg-orange text-orange-foreground"
            to="/timed"
            onSelect={close}
          >
            Chrono 120s
          </MenuLink>
          <MenuLink
            activeClass="bg-purple text-purple-foreground"
            to="/mastermind"
            onSelect={close}
          >
            Mastermind
          </MenuLink>
        </>
      )}
    </Dropdown>
  );
}

function ShopDropdown({ prefetch }: { prefetch: HoverHandlers }) {
  const location = useLocation();
  const active =
    location.pathname === "/shop" || location.pathname === "/inventory";

  return (
    <Dropdown
      className="grid w-52 gap-1"
      trigger="Boutique"
      triggerClassName={navClass(active)}
    >
      {(close) => (
        <>
          <MenuLink prefetch={prefetch} to="/shop" onSelect={close}>
            Boutique
          </MenuLink>
          <MenuLink prefetch={prefetch} to="/inventory" onSelect={close}>
            Inventaire
          </MenuLink>
        </>
      )}
    </Dropdown>
  );
}

function CommunityDropdown({
  leaderboardPrefetch,
  playersPrefetch,
}: {
  leaderboardPrefetch: HoverHandlers;
  playersPrefetch: HoverHandlers;
}) {
  const location = useLocation();
  const active =
    location.pathname === "/leaderboard" || location.pathname === "/players";

  return (
    <Dropdown
      className="grid w-52 gap-1"
      trigger="Communauté"
      triggerClassName={navClass(active)}
    >
      {(close) => (
        <>
          <MenuLink
            prefetch={leaderboardPrefetch}
            to="/leaderboard"
            onSelect={close}
          >
            Classement
          </MenuLink>
          <MenuLink prefetch={playersPrefetch} to="/players" onSelect={close}>
            Joueurs
          </MenuLink>
        </>
      )}
    </Dropdown>
  );
}

function HeaderPoints({
  loading = false,
  points,
  mobile = false,
}: {
  loading?: boolean;
  points: number;
  mobile?: boolean;
}) {
  if (loading) {
    return (
      <Skeleton
        className={`${mobile ? "h-10 w-full" : "h-9 w-24"} rounded-md`}
      />
    );
  }

  const exactPoints = points.toLocaleString("en-US");

  return (
    <div
      aria-label={`${exactPoints} smotucoin`}
      className={`group relative flex ${mobile ? "h-10" : "h-9"} items-center justify-center rounded-md ${mobile ? "bg-muted" : "border border-border bg-card"} px-2.5 text-sm font-black text-foreground`}
      tabIndex={0}
    >
      <PointsAmount value={points} />
      <span
        className={`pointer-events-none absolute ${mobile ? "left-1/2 top-[calc(100%+8px)] -translate-x-1/2" : "right-0 top-[calc(100%+8px)]"} z-40 whitespace-nowrap rounded-md border border-input bg-card px-2.5 py-1.5 text-xs font-black text-foreground opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-within:opacity-100`}
      >
        {exactPoints} smotucoin
      </span>
    </div>
  );
}

function ThemeMenu({
  mobile = false,
  onDone,
  onThemeChange,
  ownedThemeIds = ["theme-default"],
  signedIn,
  themeId = "theme-default",
}: {
  mobile?: boolean;
  onDone?: () => void;
  onThemeChange?: (itemId: ShopItemId) => void | Promise<void>;
  ownedThemeIds?: ShopItemId[];
  signedIn: boolean;
  themeId?: ShopItemId;
}) {
  const navigate = useNavigate();
  const [busyTheme, setBusyTheme] = useState<ShopItemId | "">("");
  const owned = new Set<ShopItemId>(["theme-default", ...ownedThemeIds]);

  if (!signedIn) {
    return null;
  }

  async function selectTheme(itemId: ShopItemId) {
    if (!owned.has(itemId)) {
      navigate("/shop?section=theme");
      return;
    }

    if (!onThemeChange || itemId === themeId) {
      return;
    }

    setBusyTheme(itemId);
    try {
      await onThemeChange(itemId);
    } finally {
      setBusyTheme("");
    }
  }

  function renderOption(item: ShopItem, close?: () => void) {
    const active = item.id === themeId;
    const locked = !owned.has(item.id);

    return (
      <button
        aria-checked={active}
        className={`flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm font-bold transition ${
          active
            ? "bg-primary text-primary-foreground"
            : "text-subtle-foreground hover:bg-muted"
        }`}
        disabled={Boolean(busyTheme)}
        key={item.id}
        role="menuitemradio"
        title={locked ? "À débloquer dans la boutique" : item.name}
        type="button"
        onClick={() => {
          // Ferme le menu dans tous les cas : un thème verrouillé navigue vers
          // la boutique et le panneau ne doit pas rester flotter par-dessus.
          void selectTheme(item.id);
          close?.();
        }}
      >
        <span
          aria-hidden="true"
          className="size-4 shrink-0 rounded-full border border-border"
          style={{
            background: `linear-gradient(135deg, ${item.preview.primary} 50%, ${item.preview.secondary} 50%)`,
          }}
        />
        <span className="flex-1 truncate text-left">{item.name}</span>
        {locked ? (
          <>
            <PointsAmount
              className="text-xs"
              iconClassName="size-3.5"
              value={item.price}
            />
            <span aria-hidden="true">🔒</span>
          </>
        ) : active ? (
          <span aria-hidden="true">✓</span>
        ) : null}
      </button>
    );
  }

  if (mobile) {
    return (
      <div aria-label="Thème" className="grid gap-1" role="menu">
        {THEME_ITEMS.map((item) => renderOption(item, onDone))}
      </div>
    );
  }

  const activeItem = THEME_ITEMS.find((item) => item.id === themeId);

  return (
    <Dropdown
      align="right"
      className="grid w-64 gap-1"
      trigger={
        <>
          <span className="sr-only">Choisir le thème</span>
          <span
            aria-hidden="true"
            className="size-4 rounded-full border border-border"
            style={{
              background: `linear-gradient(135deg, ${activeItem?.preview.primary ?? "#538d4e"} 50%, ${activeItem?.preview.secondary ?? "#f5f6f8"} 50%)`,
            }}
          />
        </>
      }
      // after:-inset-1 : la cible tactile passe de 36px à 44px sans grossir le bouton.
      triggerClassName="relative grid size-9 place-items-center rounded-md border border-border bg-card text-subtle-foreground transition after:absolute after:-inset-1 hover:bg-muted active:scale-[0.96]"
    >
      {(close) => THEME_ITEMS.map((item) => renderOption(item, close))}
    </Dropdown>
  );
}

export function Header({
  isAdmin,
  loading,
  onSignIn,
  onSignOut,
  onThemeChange,
  ownedThemeIds,
  points,
  pointsLoading,
  signedIn,
  themeId,
}: HeaderProps) {
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const leaderboardPrefetch = usePrefetchOnHover(["/api/leaderboards"]);
  const profilePrefetch = usePrefetchOnHover(["/api/profile"], signedIn);
  const playersPrefetch = usePrefetchOnHover(["/api/players/search?q="], signedIn);
  const adminPrefetch = usePrefetchOnHover(["/api/admin/overview"], isAdmin);
  const shopPrefetch = usePrefetchOnHover(["/api/shop"], signedIn);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const menu = mobileMenuRef.current;

      if (!menu || menu.contains(event.target as Node)) {
        return;
      }

      setMobileOpen(false);
    }

    // Symétrique du composant Dropdown : Escape ferme aussi le panneau mobile.
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  return (
    <header className="h-(--header-height) border-b border-input">
      <div
        className="relative mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-4"
        ref={mobileMenuRef}
      >
        <Link className="flex items-center gap-3" to="/">
          <LogoMark />
          <div className="text-left">
            <h1 className="text-2xl font-black uppercase tracking-[0.08em]">
              Smotu
            </h1>
          </div>
        </Link>

        <nav
          className="hidden max-w-full rounded-lg bg-card p-1 md:flex"
          aria-label="Navigation principale"
        >
          <NavLink className={({ isActive }) => navClass(isActive)} to="/">
            Accueil
          </NavLink>
          <GameModeDropdown />
          <ShopDropdown prefetch={shopPrefetch} />
          <CommunityDropdown
            leaderboardPrefetch={leaderboardPrefetch}
            playersPrefetch={playersPrefetch}
          />
          <NavLink
            className={({ isActive }) => navClass(isActive)}
            to="/profile"
            {...profilePrefetch}
          >
            Profil
          </NavLink>
          {isAdmin ? (
            <NavLink
              className={({ isActive }) => navClass(isActive)}
              to="/admin"
              {...adminPrefetch}
            >
              Admin
            </NavLink>
          ) : null}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeMenu
            signedIn={signedIn}
            themeId={themeId}
            ownedThemeIds={ownedThemeIds}
            onThemeChange={onThemeChange}
          />
          <HeaderPoints loading={pointsLoading} points={points} />
          <AuthAction
            loading={loading}
            signedIn={signedIn}
            onSignIn={onSignIn}
            onSignOut={onSignOut}
            onShowAuth={() => navigate("/auth")}
          />
        </div>

        <button
          className="grid size-10 place-items-center rounded-md bg-card text-subtle-foreground transition hover:bg-muted md:hidden"
          type="button"
          aria-expanded={mobileOpen}
          aria-label="Ouvrir la navigation"
          onClick={() => setMobileOpen((value) => !value)}
        >
          <span className="grid gap-1.5" aria-hidden="true">
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
          </span>
        </button>

        {mobileOpen ? (
          <div className="absolute left-4 right-4 top-[calc(100%-4px)] z-30 origin-top rounded-lg border border-input bg-card p-2 shadow-xl transition-[opacity,scale] duration-150 ease-(--ease-out-strong) starting:opacity-0 motion-safe:starting:scale-[0.98] md:hidden">
            <nav className="grid gap-1" aria-label="Navigation mobile">
              <NavLink
                className={({ isActive }) => navClass(isActive, true)}
                to="/"
                onClick={() => setMobileOpen(false)}
              >
                Accueil
              </NavLink>
              <NavLink
                className={({ isActive }) => navClass(isActive, true)}
                to="/play"
                onClick={() => setMobileOpen(false)}
              >
                Mot du jour
              </NavLink>
              <NavLink
                className={({ isActive }) => navClass(isActive, true)}
                to="/endless"
                onClick={() => setMobileOpen(false)}
              >
                Mode libre
              </NavLink>
              <NavLink
                className={({ isActive }) => navClass(isActive, true)}
                to="/mastermind"
                onClick={() => setMobileOpen(false)}
              >
                Mastermind
              </NavLink>
              <NavLink
                className={({ isActive }) => navClass(isActive, true)}
                to="/shop"
                onClick={() => setMobileOpen(false)}
                {...shopPrefetch}
              >
                Boutique
              </NavLink>
              <NavLink
                className={({ isActive }) => navClass(isActive, true)}
                to="/inventory"
                onClick={() => setMobileOpen(false)}
                {...shopPrefetch}
              >
                Inventaire
              </NavLink>
              <NavLink
                className={({ isActive }) => navClass(isActive, true)}
                to="/leaderboard"
                onClick={() => setMobileOpen(false)}
                {...leaderboardPrefetch}
              >
                Classement
              </NavLink>
              <NavLink
                className={({ isActive }) => navClass(isActive, true)}
                to="/players"
                onClick={() => setMobileOpen(false)}
                {...playersPrefetch}
              >
                Joueurs
              </NavLink>
              <NavLink
                className={({ isActive }) => navClass(isActive, true)}
                to="/profile"
                onClick={() => setMobileOpen(false)}
                {...profilePrefetch}
              >
                Profil
              </NavLink>
              {isAdmin ? (
                <NavLink
                  className={({ isActive }) => navClass(isActive, true)}
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  {...adminPrefetch}
                >
                  Admin
                </NavLink>
              ) : null}
            </nav>
            <div className="mt-2 grid gap-2 border-t border-border pt-2">
              <ThemeMenu
                mobile
                signedIn={signedIn}
                themeId={themeId}
                ownedThemeIds={ownedThemeIds}
                onDone={() => setMobileOpen(false)}
                onThemeChange={onThemeChange}
              />
              <HeaderPoints mobile loading={pointsLoading} points={points} />
              <AuthAction
                className="w-full"
                loading={loading}
                onDone={() => setMobileOpen(false)}
                signedIn={signedIn}
                onSignIn={onSignIn}
                onSignOut={onSignOut}
                onShowAuth={() => navigate("/auth")}
              />
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
