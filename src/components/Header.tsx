import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button, LogoMark, Skeleton } from "./ui";

type HeaderProps = {
  loading: boolean;
  onSignIn: () => void | Promise<void>;
  onSignOut: () => void | Promise<void>;
  signedIn: boolean;
};

function navClass(active: boolean, block = false): string {
  return `${block ? "block w-full" : ""} rounded-md px-3 py-2 text-sm font-bold transition ${
    active
      ? "bg-[#f8f8f8] text-[#121213]"
      : "text-[#d7dadc] hover:bg-[#272729]"
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
  const active = location.pathname === "/play" || location.pathname === "/endless";

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
          className="absolute left-0 top-11 z-20 w-52 rounded-lg border border-[#3a3a3c] bg-[#18191b] p-1 shadow-xl"
          role="menu"
        >
          <Link
            className={`block rounded-md px-3 py-2 text-sm font-bold transition ${
              location.pathname === "/play"
                ? "bg-[#538d4e] text-white"
                : "text-[#d7dadc] hover:bg-[#272729]"
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
                ? "bg-[#b59f3b] text-white"
                : "text-[#d7dadc] hover:bg-[#272729]"
            }`}
            role="menuitem"
            to="/endless"
            onClick={() => setOpen(false)}
          >
            Mode libre
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function Header({
  loading,
  onSignIn,
  onSignOut,
  signedIn,
}: HeaderProps) {
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <header className="h-[var(--header-height)] border-b border-[#3a3a3c]">
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
          className="hidden max-w-full rounded-lg bg-[#18191b] p-1 md:flex"
          aria-label="Navigation principale"
        >
          <NavLink className={({ isActive }) => navClass(isActive)} to="/">
            Accueil
          </NavLink>
          <GameModeDropdown />
          <NavLink
            className={({ isActive }) => navClass(isActive)}
            to="/leaderboard"
          >
            Classement
          </NavLink>
          <NavLink
            className={({ isActive }) => navClass(isActive)}
            to="/profile"
          >
            Profil
          </NavLink>
        </nav>

        <div className="hidden md:block">
          <AuthAction
            loading={loading}
            signedIn={signedIn}
            onSignIn={onSignIn}
            onSignOut={onSignOut}
            onShowAuth={() => navigate("/auth")}
          />
        </div>

        <button
          className="grid size-10 place-items-center rounded-md bg-[#18191b] text-[#d7dadc] transition hover:bg-[#272729] md:hidden"
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
          <div className="absolute left-4 right-4 top-[calc(100%-4px)] z-30 rounded-lg border border-[#3a3a3c] bg-[#18191b] p-2 shadow-xl md:hidden">
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
                to="/leaderboard"
                onClick={() => setMobileOpen(false)}
              >
                Classement
              </NavLink>
              <NavLink
                className={({ isActive }) => navClass(isActive, true)}
                to="/profile"
                onClick={() => setMobileOpen(false)}
              >
                Profil
              </NavLink>
            </nav>
            <div className="mt-2 border-t border-[#2f3033] pt-2">
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
