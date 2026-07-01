import type { UseShooAuthResult } from "@shoojs/react";
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Button, LogoMark, Skeleton } from "./ui";

type HeaderProps = {
  auth: UseShooAuthResult;
};

function navClass(active: boolean): string {
  return `rounded-md px-3 py-2 text-sm font-bold transition ${
    active
      ? "bg-[#f8f8f8] text-[#121213]"
      : "text-[#d7dadc] hover:bg-[#272729]"
  }`;
}

function GameModeDropdown() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const active = location.pathname === "/play" || location.pathname === "/endless";

  return (
    <div className="relative">
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

export function Header({ auth }: HeaderProps) {
  const signedIn = Boolean(auth.identity.userId);

  return (
    <header className="border-b border-[#3a3a3c]">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link className="flex items-center gap-3" to="/">
          <LogoMark />
          <div className="text-left">
            <h1 className="text-2xl font-black uppercase tracking-[0.08em]">
              Smotu
            </h1>
            <p className="text-xs font-semibold text-[#818384]">
              Le mot quotidien
            </p>
          </div>
        </Link>

        <nav
          className="flex max-w-full rounded-lg bg-[#18191b] p-1"
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
        </nav>

        {auth.loading ? (
          <Skeleton className="h-9 w-32" />
        ) : signedIn ? (
          <Button
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => auth.clearIdentity()}
          >
            Se déconnecter
          </Button>
        ) : (
          <Button
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => void auth.signIn({ requestPii: true })}
          >
            Se connecter
          </Button>
        )}
      </div>
    </header>
  );
}
