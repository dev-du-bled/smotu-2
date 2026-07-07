import { useMemo } from "react";
import type { PlayerSearchResult, PublicPlayerProfile } from "../../shared/game";
import { apiJson, useApiResource } from "../lib/api";
import { emptyProfileStats } from "./use-profile";

function emptyPublicPlayerProfile(playerId = ""): PublicPlayerProfile {
  return {
    ...emptyProfileStats(playerId),
    userId: playerId,
    friendshipStatus: "none",
  };
}

export function usePlayerSearch(query: string, enabled: boolean) {
  const normalized = query.trim();
  const path = `/api/players/search?q=${encodeURIComponent(normalized)}`;
  return useApiResource<PlayerSearchResult[]>(path, enabled, []);
}

export function usePublicPlayerProfile(playerId: string | undefined, enabled: boolean) {
  const path = `/api/players/${encodeURIComponent(playerId ?? "")}`;
  const fallback = useMemo(() => emptyPublicPlayerProfile(playerId), [playerId]);
  return useApiResource<PublicPlayerProfile>(path, enabled && Boolean(playerId), fallback);
}

export async function requestPlayerFriend(targetUserId: string) {
  return apiJson("/api/friends/request", {
    method: "POST",
    body: JSON.stringify({ targetUserId }),
  });
}
