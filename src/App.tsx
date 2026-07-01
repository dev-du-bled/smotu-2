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
  onSignIn,
  signedIn,
  token,
}: {
  onSignIn: () => void | Promise<void>;
  signedIn: boolean;
  token?: string;
}) {
  const daily = useDailyGame(token);

  return (
    <PlayPage
      playProps={daily.playProps}
      signedIn={signedIn}
      onSignIn={onSignIn}
    />
  );
}

function EndlessRoute({
  onSignIn,
  signedIn,
  token,
}: {
  onSignIn: () => void | Promise<void>;
  signedIn: boolean;
  token?: string;
}) {
  const endless = useEndlessGame(token);

  return (
    <EndlessPage
      {...endless}
      signedIn={signedIn}
      onSignIn={onSignIn}
    />
  );
}

function LeaderboardRoute({
  onSignIn,
  signedIn,
  token,
}: {
  onSignIn: () => void | Promise<void>;
  signedIn: boolean;
  token?: string;
}) {
  const leaderboard = useGlobalLeaderboard(token);

  return (
    <LeaderboardPage
      leaderboard={leaderboard.data}
      signedIn={signedIn}
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
