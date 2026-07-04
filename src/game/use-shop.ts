import type { ShopState } from "../../shared/game";
import { apiJson, useApiResource } from "../lib/api";

export const emptyShopState: ShopState = {
  items: [],
  inventory: {
    balance: 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
    purchases: [],
    ownedItemIds: [],
    hintLetterCount: 0,
    hintPositionCount: 0,
    hintMastermindCount: 0,
  },
};

export function useShop(enabled: boolean) {
  const resource = useApiResource<ShopState>("/api/shop", enabled, emptyShopState);

  async function buy(itemId: string) {
    const state = await apiJson<ShopState>("/api/shop/buy", {
      method: "POST",
      body: JSON.stringify({ itemId }),
    });
    resource.setData(state);
    window.dispatchEvent(new CustomEvent("smotu:score", { detail: { score: 0 } }));
    return state;
  }

  return { ...resource, buy };
}
