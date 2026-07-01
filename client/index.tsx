import { Route, Router, Routes, useAuth } from "lakebed/client";
import { Shell, Surface } from "./components/ui";
import { useDailyGame } from "./game/use-daily-game";
import { useEndlessGame } from "./game/use-endless-game";
import { Header } from "./layout/header";
import { EndlessPage } from "./pages/endless";
import { HomePage } from "./pages/home";
import { LeaderboardPage } from "./pages/leaderboard";
import { NotFoundPage } from "./pages/not-found";
import { PlayPage } from "./pages/play";

function EndlessRoute() {
  const endless = useEndlessGame();

  return <EndlessPage {...endless} />;
}

export function App() {
  const auth = useAuth();
  const { bestScore, game, leaderboard, playProps } = useDailyGame();

  return (
    <Router>
      <Shell>
        <Surface>
          <Header auth={auth} />

          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  bestScore={bestScore}
                  game={game}
                  leaderboardCount={leaderboard.length}
                />
              }
            />
            <Route path="/play" element={<PlayPage {...playProps} />} />
            <Route path="/endless" element={<EndlessRoute />} />
            <Route
              path="/leaderboard"
              element={<LeaderboardPage leaderboard={leaderboard} />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Surface>
      </Shell>
    </Router>
  );
}
