import { Route, Router, Routes, useAuth } from "lakebed/client";
import { Shell, Surface } from "./components/ui";
import { useDailyGame } from "./game/use-daily-game";
import { Header } from "./layout/header";
import { HomePage } from "./pages/home";
import { LeaderboardPage } from "./pages/leaderboard";
import { NotFoundPage } from "./pages/not-found";
import { PlayPage } from "./pages/play";

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
