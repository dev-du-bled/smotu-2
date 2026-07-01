import { useShooAuth } from "@shoojs/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { Shell, Surface } from "./components/ui";
import { useDailyGame, useGlobalLeaderboard } from "./game/use-daily-game";
import { useEndlessGame } from "./game/use-endless-game";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { EndlessPage } from "./pages/EndlessPage";
import { HomePage } from "./pages/HomePage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PlayPage } from "./pages/PlayPage";

function useSignIn(auth: ReturnType<typeof useShooAuth>) {
  return () =>
    auth.signIn({
      requestPii: true,
      returnTo: `${window.location.pathname}${window.location.search}`,
    });
}

function HomeRoute({
  onSignIn,
  token,
}: {
  onSignIn: () => void | Promise<void>;
  token?: string;
}) {
  const daily = useDailyGame(token);
  const leaderboard = useGlobalLeaderboard(token);

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
  onSignIn,
  signedIn,
  token,
}: {
  authLoading: boolean;
  onSignIn: () => void | Promise<void>;
  signedIn: boolean;
  token?: string;
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

  return <SignedInPlayRoute token={token} onSignIn={onSignIn} />;
}

function SignedInPlayRoute({
  onSignIn,
  token,
}: {
  onSignIn: () => void | Promise<void>;
  token?: string;
}) {
  const daily = useDailyGame(token);

  return (
    <PlayPage
      playProps={daily.playProps}
      signedIn
      onSignIn={onSignIn}
    />
  );
}

function EndlessRoute({
  authLoading,
  onSignIn,
  signedIn,
  token,
}: {
  authLoading: boolean;
  onSignIn: () => void | Promise<void>;
  signedIn: boolean;
  token?: string;
}) {
  if (!signedIn) {
    return (
      <EndlessPage
        authLoading={authLoading}
        game={undefined}
        isStarting={false}
        playProps={undefined}
        signedIn={false}
        startRound={() => undefined}
        onSignIn={onSignIn}
      />
    );
  }

  return <SignedInEndlessRoute token={token} onSignIn={onSignIn} />;
}

function SignedInEndlessRoute({
  onSignIn,
  token,
}: {
  onSignIn: () => void | Promise<void>;
  token?: string;
}) {
  const endless = useEndlessGame(token);

  return (
    <EndlessPage
      {...endless}
      signedIn
      onSignIn={onSignIn}
    />
  );
}

function LeaderboardRoute({
  authLoading,
  onSignIn,
  signedIn,
  token,
}: {
  authLoading: boolean;
  onSignIn: () => void | Promise<void>;
  signedIn: boolean;
  token?: string;
}) {
  if (!signedIn) {
    return (
      <LeaderboardPage
        authLoading={authLoading}
        leaderboard={[]}
        signedIn={false}
        onSignIn={onSignIn}
      />
    );
  }

  return <SignedInLeaderboardRoute token={token} onSignIn={onSignIn} />;
}

function SignedInLeaderboardRoute({
  onSignIn,
  token,
}: {
  onSignIn: () => void | Promise<void>;
  token?: string;
}) {
  const leaderboard = useGlobalLeaderboard(token);

  return (
    <LeaderboardPage
      leaderboard={leaderboard.data}
      signedIn
      onSignIn={onSignIn}
    />
  );
}

export function App() {
  const auth = useShooAuth({
    autoSessionMonitor: true,
    callbackPath: "/auth/callback",
    requestPii: true,
    shooBaseUrl: "https://shoo.dev",
  });
  const token = auth.identity.token;
  const signedIn = Boolean(auth.identity.userId && token);
  const signIn = useSignIn(auth);

  return (
    <BrowserRouter>
      <Shell>
        <Surface>
          <Header auth={auth} />
          <Routes>
            <Route
              path="/"
              element={<HomeRoute token={token} onSignIn={signIn} />}
            />
            <Route
              path="/play"
              element={
                <PlayRoute
                  authLoading={auth.loading}
                  signedIn={signedIn}
                  token={token}
                  onSignIn={signIn}
                />
              }
            />
            <Route
              path="/endless"
              element={
                <EndlessRoute
                  authLoading={auth.loading}
                  signedIn={signedIn}
                  token={token}
                  onSignIn={signIn}
                />
              }
            />
            <Route
              path="/leaderboard"
              element={
                <LeaderboardRoute
                  authLoading={auth.loading}
                  signedIn={signedIn}
                  token={token}
                  onSignIn={signIn}
                />
              }
            />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Surface>
      </Shell>
    </BrowserRouter>
  );
}
