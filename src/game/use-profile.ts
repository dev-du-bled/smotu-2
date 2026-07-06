import { useMemo } from "react";
import {
  DEFAULT_PUBLIC_AVATAR,
  DEFAULT_SHOP_EQUIPMENT,
  type ProfileStats,
} from "../../shared/game";
import { useApiResource } from "../lib/api";

export function emptyProfileStats(userId = ""): ProfileStats {
  return {
    userId,
    userName: userId ? `Joueur ${userId.slice(-6)}` : "Joueur",
    publicAvatar: DEFAULT_PUBLIC_AVATAR,
    totalScore: 0,
    dailyScore: 0,
    endlessScore: 0,
    mastermindScore: 0,
    gamesSolved: 0,
    dailySolved: 0,
    endlessSolved: 0,
    mastermindSolved: 0,
    lastScoredAt: "",
    inventory: {
      balance: 0,
      equipped: { ...DEFAULT_SHOP_EQUIPMENT },
      ownedCount: 0,
      ownedThemeIds: [DEFAULT_PUBLIC_AVATAR.themeId],
      totalItems: 0,
      consumables: {
        hintLetter: 0,
        hintPosition: 0,
        hintMastermind: 0,
      },
      publicAvatar: DEFAULT_PUBLIC_AVATAR,
    },
    rank: null,
    recentGames: [],
  };
}

export function useProfileStats(enabled: boolean, userId: string | undefined) {
  const fallback = useMemo(() => emptyProfileStats(userId), [userId]);
  return useApiResource<ProfileStats>("/api/profile", enabled, fallback);
}
