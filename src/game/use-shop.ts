import {
  DEFAULT_PUBLIC_AVATAR,
  DEFAULT_SHOP_EQUIPMENT,
  SHOP_SECTIONS,
  defaultOwnedItemIds,
  type ShopEquipSlot,
  type ShopState,
} from "../../shared/game";
import { apiJson, useApiResource } from "../lib/api";

const defaultOwned = defaultOwnedItemIds();

export const emptyShopState: ShopState = {
  sections: SHOP_SECTIONS,
  items: [],
  inventory: {
    balance: 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
    purchases: [],
    ownedItemIds: defaultOwned,
    ownedByCategory: {
      avatar: [DEFAULT_SHOP_EQUIPMENT.avatar],
      hat: [DEFAULT_SHOP_EQUIPMENT.hat],
      shirt: [DEFAULT_SHOP_EQUIPMENT.shirt],
      confetti: [DEFAULT_SHOP_EQUIPMENT.confetti],
      theme: [DEFAULT_SHOP_EQUIPMENT.theme],
      hint: [],
    },
    equipped: { ...DEFAULT_SHOP_EQUIPMENT },
    publicAvatar: DEFAULT_PUBLIC_AVATAR,
    consumables: {
      hintLetter: 0,
      hintPosition: 0,
      hintMastermind: 0,
    },
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

  async function equip(slot: ShopEquipSlot, itemId: string) {
    const state = await apiJson<ShopState>("/api/shop/equip", {
      method: "POST",
      body: JSON.stringify({ slot, itemId }),
    });
    resource.setData(state);
    return state;
  }

  return { ...resource, buy, equip };
}
