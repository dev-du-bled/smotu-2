import { useMemo } from "react";
import type { ProfileStats } from "../../shared/game";
import { useApiResource } from "../lib/api";

export function emptyProfileStats(userId = ""): ProfileStats {
  return {
    userId,
    userName: userId ? `Joueur ${userId.slice(-6)}` : "Joueur",
    totalScore: 0,
    dailyScore: 0,
    endlessScore: 0,
    gamesSolved: 0,
    dailySolved: 0,
    endlessSolved: 0,
    lastScoredAt: "",
    rank: null,
  };
}

export function useProfileStats(enabled: boolean, userId: string | undefined) {
  const fallback = useMemo(() => emptyProfileStats(userId), [userId]);
  return useApiResource<ProfileStats>("/api/profile", enabled, fallback);
}
