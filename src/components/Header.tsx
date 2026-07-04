import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { prefetchResource } from "../lib/api";
import { Button, LogoMark, PointsAmount, Skeleton } from "./ui";

type HeaderProps = {
  isAdmin: boolean;
  loading: boolean;
  onSignIn: () => void | Promise<void>;
  onSignOut: () => void | Promise<void>;
  points: number;
  pointsLoading: boolean;
  signedIn: boolean;
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

function GameModeDropdown() {
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const active =
    location.pathname === "/play" ||
    location.pathname === "/endless" ||
    location.pathname === "/mastermind";

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const dropdown = dropdownRef.current;

      if (!dropdown || dropdown.contains(event.target as Node)) {
        return;
      }

      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={navClass(active)}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        Modes
      </button>

      {open ? (
        <div
          className="absolute left-0 top-11 z-20 w-52 rounded-lg border border-input bg-card p-1 shadow-xl"
          role="menu"
        >
          <Link
            className={`block rounded-md px-3 py-2 text-sm font-bold transition ${
              location.pathname === "/play"
                ? "bg-success text-success-foreground"
                : "text-subtle-foreground hover:bg-muted"
            }`}
            role="menuitem"
            to="/play"
            onClick={() => setOpen(false)}
          >
            Mot du jour
          </Link>
          <Link
            className={`mt-1 block rounded-md px-3 py-2 text-sm font-bold transition ${
              location.pathname === "/endless"
                ? "bg-warning text-warning-foreground"
                : "text-subtle-foreground hover:bg-muted"
            }`}
            role="menuitem"
            to="/endless"
            onClick={() => setOpen(false)}
          >
            Mode libre
          </Link>
          <Link
            className={`mt-1 block rounded-md px-3 py-2 text-sm font-bold transition ${
              location.pathname === "/mastermind"
                ? "bg-purple text-purple-foreground"
                : "text-subtle-foreground hover:bg-muted"
            }`}
            role="menuitem"
            to="/mastermind"
            onClick={() => setOpen(false)}
          >
            Mastermind
          </Link>
        </div>
      ) : null}
    </div>
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

export function Header({
  isAdmin,
  loading,
  onSignIn,
  onSignOut,
  points,
  pointsLoading,
  signedIn,
}: HeaderProps) {
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const leaderboardPrefetch = usePrefetchOnHover(["/api/leaderboards"]);
  const profilePrefetch = usePrefetchOnHover(["/api/profile"], signedIn);
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

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
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
          <NavLink
            className={({ isActive }) => navClass(isActive)}
            to="/shop"
            {...shopPrefetch}
          >
            Boutique
          </NavLink>
          <NavLink
            className={({ isActive }) => navClass(isActive)}
            to="/leaderboard"
            {...leaderboardPrefetch}
          >
            Classement
          </NavLink>
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
          <div className="absolute left-4 right-4 top-[calc(100%-4px)] z-30 rounded-lg border border-input bg-card p-2 shadow-xl md:hidden">
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
                to="/leaderboard"
                onClick={() => setMobileOpen(false)}
                {...leaderboardPrefetch}
              >
                Classement
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
