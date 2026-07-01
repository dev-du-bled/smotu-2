import { Link, SignInWithGoogle, signOut, useLocation } from "lakebed/client";
import { useState } from "preact/hooks";
import { Button, LogoMark, Skeleton } from "../components/ui";

type HeaderAuth = {
  isGuest?: boolean;
  isLoading?: boolean;
};

function NavLink({ children, to }: { children: string; to: string }) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      className={`rounded-md px-3 py-2 text-sm font-bold transition ${
        active
          ? "bg-[#f8f8f8] text-[#121213]"
          : "text-[#d7dadc] hover:bg-[#272729]"
      }`}
      to={to}
    >
      {children}
    </Link>
  );
}

function GameModeDropdown() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const active = location.pathname === "/play" || location.pathname === "/endless";

  return (
    <div className="relative">
      <button
        className={`rounded-md px-3 py-2 text-sm font-bold transition ${
          active
            ? "bg-[#f8f8f8] text-[#121213]"
            : "text-[#d7dadc] hover:bg-[#272729]"
        }`}
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

export function Header({ auth }: { auth: HeaderAuth }) {
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
          <NavLink to="/">Accueil</NavLink>
          <GameModeDropdown />
          <NavLink to="/leaderboard">Classement</NavLink>
        </nav>

        {auth.isLoading ? (
          <Skeleton className="h-9 w-32" />
        ) : auth.isGuest ? (
          <SignInWithGoogle className="h-9 rounded-md bg-[#3a3a3c] px-3 text-sm font-bold text-white hover:bg-[#4a4a4d]">
            Se connecter
          </SignInWithGoogle>
        ) : (
          <Button
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => signOut()}
          >
            Se déconnecter
          </Button>
        )}
      </div>
    </header>
  );
}
