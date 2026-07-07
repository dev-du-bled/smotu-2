import type { FriendsState } from "../../shared/game";
import { apiJson, useApiResource } from "../lib/api";

const emptyFriendsState: FriendsState = {
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
};

export function useFriends(enabled: boolean) {
  const resource = useApiResource<FriendsState>(
    "/api/friends",
    enabled,
    emptyFriendsState,
  );

  async function requestFriend(targetUserId: string) {
    const state = await apiJson<FriendsState>("/api/friends/request", {
      method: "POST",
      body: JSON.stringify({ targetUserId }),
    });
    resource.setData(state);
    return state;
  }

  async function respond(requestId: string, accept: boolean) {
    const state = await apiJson<FriendsState>("/api/friends/respond", {
      method: "POST",
      body: JSON.stringify({ requestId, accept }),
    });
    resource.setData(state);
    return state;
  }

  async function removeFriend(targetUserId: string) {
    const state = await apiJson<FriendsState>("/api/friends/remove", {
      method: "POST",
      body: JSON.stringify({ targetUserId }),
    });
    resource.setData(state);
    return state;
  }

  return { ...resource, requestFriend, respond, removeFriend };
}
