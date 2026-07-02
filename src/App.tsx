import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Shell, Surface } from "./components/ui";
import { useDailyGame, useGlobalLeaderboard } from "./game/use-daily-game";
import { useEndlessGame } from "./game/use-endless-game";
import { emptyProfileStats, useProfileStats } from "./game/use-profile";
import { emptyLeaderboard } from "./game/state";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { AuthPage } from "./pages/AuthPage";
import { EndlessPage } from "./pages/EndlessPage";
import { HomePage } from "./pages/HomePage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PlayPage } from "./pages/PlayPage";
import { ProfilePage } from "./pages/ProfilePage";
import { authClient, type AuthUser } from "./lib/auth";

type EmailAuthInput = {
  email: string;
  name?: string;
  password: string;
};

function useSignIn() {
  return async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: `${window.location.pathname}${window.location.search}`,
    });
  };
}

function HomeRoute({
  enabled,
  onSignIn,
}: {
  enabled: boolean;
  onSignIn: () => void | Promise<void>;
}) {
  const daily = useDailyGame(enabled);
  const leaderboard = useGlobalLeaderboard(enabled);

  return (
    <HomePage
      bestScore={leaderboard.data[0]?.totalScore ?? 0}
      game={daily.game}
      leaderboardCount={leaderboard.data.length}
    />
  );
}

function PlayRoute({
  authLoading,
  enabled,
  onSignIn,
  signedIn,
}: {
  authLoading: boolean;
  enabled: boolean;
  onSignIn: () => void | Promise<void>;
  signedIn: boolean;
}) {
  if (!signedIn) {
    return (
      <PlayPage
        authLoading={authLoading}
        playProps={undefined}
        signedIn={false}
        onSignIn={onSignIn}
      />
    );
  }

  return <SignedInPlayRoute enabled={enabled} onSignIn={onSignIn} />;
}

function SignedInPlayRoute({
  enabled,
  onSignIn,
}: {
  enabled: boolean;
  onSignIn: () => void | Promise<void>;
}) {
  const daily = useDailyGame(enabled);

  return (
    <PlayPage
      playProps={daily.playProps}
      signedIn
      onSignIn={onSignIn}
    />
  );
}

function EndlessRoute({
  signedIn,
}: {
  signedIn: boolean;
}) {
  const endless = useEndlessGame(signedIn);

  return <EndlessPage {...endless} signedIn={signedIn} />;
}

function LeaderboardRoute({
  authLoading,
  enabled,
  onSignIn,
  signedIn,
}: {
  authLoading: boolean;
  enabled: boolean;
  onSignIn: () => void | Promise<void>;
  signedIn: boolean;
}) {
  if (!signedIn) {
    return (
      <LeaderboardPage
        authLoading={authLoading}
        leaderboard={emptyLeaderboard}
        signedIn={false}
        onSignIn={onSignIn}
      />
    );
  }

  return <SignedInLeaderboardRoute enabled={enabled} onSignIn={onSignIn} />;
}

function SignedInLeaderboardRoute({
  enabled,
  onSignIn,
}: {
  enabled: boolean;
  onSignIn: () => void | Promise<void>;
}) {
  const leaderboard = useGlobalLeaderboard(enabled);

  return (
    <LeaderboardPage
      leaderboard={leaderboard.data}
      signedIn
      onSignIn={onSignIn}
    />
  );
}

function ProfileRoute({
  authLoading,
  enabled,
  onSignIn,
  onSignOut,
  signedIn,
  user,
}: {
  authLoading: boolean;
  enabled: boolean;
  onSignIn: () => void | Promise<void>;
  onSignOut: () => void | Promise<void>;
  signedIn: boolean;
  user?: AuthUser;
}) {
  if (!signedIn) {
    return (
      <ProfilePage
        authLoading={authLoading}
        loading={false}
        stats={emptyProfileStats(user?.id)}
        signedIn={false}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
        user={user}
      />
    );
  }

  return (
    <SignedInProfileRoute
      enabled={enabled}
      onSignIn={onSignIn}
      onSignOut={onSignOut}
      user={user}
    />
  );
}

function SignedInProfileRoute({
  enabled,
  onSignIn,
  onSignOut,
  user,
}: {
  enabled: boolean;
  onSignIn: () => void | Promise<void>;
  onSignOut: () => void | Promise<void>;
  user?: AuthUser;
}) {
  const profile = useProfileStats(enabled, user?.id);

  return (
    <ProfilePage
      loading={profile.loading}
      refetch={profile.refetch}
      stats={profile.data}
      signedIn
      onSignIn={onSignIn}
      onSignOut={onSignOut}
      user={user}
    />
  );
}

export function App() {
  const session = authClient.useSession();
  const user = session.data?.user;
  const signedIn = Boolean(user);
  const signIn = useSignIn();
  const signInWithEmail = async ({ email, password }: EmailAuthInput) => {
    const response = await authClient.signIn.email({ email, password });
    if (response.error) {
      throw new Error(response.error.message || "Connexion impossible.");
    }
    await session.refetch();
  };
  const signUpWithEmail = async ({ email, name, password }: EmailAuthInput) => {
    const response = await authClient.signUp.email({
      email,
      name: name?.trim() || email,
      password,
    });
    if (response.error) {
      throw new Error(response.error.message || "Inscription impossible.");
    }
    await session.refetch();
  };
  const signOut = async () => {
    await authClient.signOut();
  };

  return (
    <BrowserRouter>
      <Shell>
        <Surface>
          <Header
            loading={session.isPending}
            signedIn={signedIn}
            onSignIn={signIn}
            onSignOut={signOut}
          />
          <div className="min-h-[calc(100dvh_-_var(--header-height))]">
            <Routes>
              <Route
                path="/"
                element={<HomeRoute enabled={signedIn} onSignIn={signIn} />}
              />
              <Route
                path="/play"
                element={
                  <PlayRoute
                    authLoading={session.isPending}
                    enabled={signedIn}
                    signedIn={signedIn}
                    onSignIn={signIn}
                  />
                }
              />
              <Route
                path="/endless"
                element={<EndlessRoute signedIn={signedIn} />}
              />
              <Route
                path="/leaderboard"
                element={
                  <LeaderboardRoute
                    authLoading={session.isPending}
                    enabled={signedIn}
                    signedIn={signedIn}
                    onSignIn={signIn}
                  />
                }
              />
              <Route
                path="/profile"
                element={
                  <ProfileRoute
                    authLoading={session.isPending}
                    enabled={signedIn}
                    signedIn={signedIn}
                    onSignIn={signIn}
                    onSignOut={signOut}
                    user={user}
                  />
                }
              />
              <Route
                path="/auth"
                element={
                  <AuthPage
                    loading={session.isPending}
                    signedIn={signedIn}
                    onEmailSignIn={signInWithEmail}
                    onEmailSignUp={signUpWithEmail}
                    onGoogleSignIn={signIn}
                  />
                }
              />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
          <Footer />
        </Surface>
      </Shell>
    </BrowserRouter>
  );
}
