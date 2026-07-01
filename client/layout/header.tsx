import { Link, SignInWithGoogle, signOut, useLocation } from "lakebed/client";
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
          className="flex rounded-lg bg-[#18191b] p-1"
          aria-label="Navigation principale"
        >
          <NavLink to="/">Accueil</NavLink>
          <NavLink to="/play">Mot du jour</NavLink>
          <NavLink to="/leaderboard">Classement</NavLink>
        </nav>

        {auth.isLoading ? (
          <Skeleton className="h-9 w-37.5" />
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
