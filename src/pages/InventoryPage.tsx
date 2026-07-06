import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DEFAULT_SHOP_EQUIPMENT,
  shopItemById,
  type PublicAvatar,
  type ShopEquipSlot,
  type ShopItem,
  type ShopItemId,
  type ShopRarity,
  type ShopState,
} from "../../shared/game";
import { AuthRequired } from "../components/AuthRequired";
import { AvatarDisplay } from "../components/AvatarDisplay";
import { ConfettiBurst } from "../components/ConfettiBurst";
import {
  ConfettiPreview,
  HintPreview,
  ThemePreview,
} from "../components/ItemPreview";
import {
  Button,
  Panel,
  PointsAmount,
  SectionKicker,
  Skeleton,
} from "../components/ui";

const RARITY_LABELS: Record<ShopRarity, string> = {
  common: "Standard",
  rare: "Rare",
  epic: "Épique",
  legendary: "Légendaire",
};

const EQUIP_SLOT_LABELS: Record<ShopEquipSlot, string> = {
  avatar: "Avatar",
  hat: "Chapeau",
  shirt: "T-shirt",
  confetti: "Confettis",
  theme: "Thème",
};

// Ordre des rayons équipables affichés dans l'inventaire.
const EQUIP_SLOTS: ShopEquipSlot[] = [
  "avatar",
  "hat",
  "shirt",
  "confetti",
  "theme",
];

function avatarWithItem(base: PublicAvatar, item: ShopItem): PublicAvatar {
  if (item.slot === "avatar") {
    return { ...base, avatarId: item.id };
  }
  if (item.slot === "hat") {
    return {
      ...base,
      hatId: item.id === DEFAULT_SHOP_EQUIPMENT.hat ? undefined : item.id,
    };
  }
  if (item.slot === "shirt") {
    return { ...base, shirtId: item.id };
  }
  if (item.slot === "confetti") {
    return { ...base, confettiId: item.id };
  }
  if (item.slot === "theme") {
    return { ...base, themeId: item.id };
  }
  return base;
}

function itemPreviewUsesAvatar(item: ShopItem): boolean {
  return (
    item.category === "avatar" ||
    item.category === "hat" ||
    item.category === "shirt"
  );
}

// Aperçu adapté à la catégorie pour les objets non portés par l'avatar.
function ItemPreview({ item }: { item: ShopItem }) {
  if (item.category === "theme") {
    return <ThemePreview item={item} />;
  }
  if (item.category === "confetti") {
    return <ConfettiPreview item={item} />;
  }
  return <HintPreview item={item} />;
}

export function InventoryPage({
  authLoading = false,
  equip,
  loading,
  shop,
  signedIn,
}: {
  authLoading?: boolean;
  equip: (slot: ShopEquipSlot, itemId: string) => Promise<ShopState>;
  loading: boolean;
  shop: ShopState;
  signedIn: boolean;
}) {
  const [busyAction, setBusyAction] = useState("");
  const [confettiPreview, setConfettiPreview] = useState<{
    burstKey: string;
    skin?: ShopItemId;
  }>({ burstKey: "" });
  const [message, setMessage] = useState("");

  if (!signedIn) {
    return (
      <AuthRequired
        loading={authLoading}
        title={authLoading ? "Verification de ta session." : "Connecte-toi pour voir ton inventaire."}
        description="Ton inventaire regroupe tous les cosmétiques débloqués avec tes smotucoins."
        eyebrow="Inventaire"
      />
    );
  }

  async function equipItem(item: ShopItem) {
    if (!item.slot) {
      return;
    }

    setBusyAction(`equip:${item.id}`);
    setMessage("");
    try {
      await equip(item.slot, item.id);
      setMessage("Équipement mis à jour.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Équipement impossible.");
    } finally {
      setBusyAction("");
    }
  }

  const ownedEquipCount = EQUIP_SLOTS.reduce(
    (total, slot) => total + (shop.inventory.ownedByCategory[slot]?.length ?? 0),
    0,
  );
  // Un joueur neuf ne possède que les cosmétiques par défaut (un par rayon).
  const inventoryEmpty = ownedEquipCount <= EQUIP_SLOTS.length;
  const consumables = [
    { label: "Indices lettres", value: shop.inventory.consumables.hintLetter },
    { label: "Positions", value: shop.inventory.consumables.hintPosition },
    { label: "Mastermind", value: shop.inventory.consumables.hintMastermind },
  ];

  return (
    <div className="mx-auto min-h-[inherit] max-w-6xl space-y-6 px-4 py-8">
      <ConfettiBurst
        burstKey={confettiPreview.burstKey}
        skin={confettiPreview.skin}
      />
      <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div>
          <SectionKicker>Inventaire</SectionKicker>
          <h2 className="mt-2 text-balance text-4xl font-black">Mes cosmétiques</h2>
          <p className="mt-3 max-w-3xl text-pretty text-subtle-foreground">
            Retrouve tout ce que tu as débloqué et équipe l'avatar, les accessoires,
            les thèmes et les effets de victoire de ton choix.
          </p>
        </div>

        <Panel className="space-y-5">
          <div className="flex items-center gap-4">
            <AvatarDisplay
              avatar={shop.inventory.publicAvatar}
              label="Avatar équipé"
              size="xl"
            />
            <div className="min-w-0">
              <SectionKicker>Solde</SectionKicker>
              {loading ? (
                <Skeleton className="mt-2 h-10 w-32" />
              ) : (
                <PointsAmount
                  className="mt-2 text-4xl font-black"
                  iconClassName="size-8"
                  value={shop.inventory.balance}
                />
              )}
            </div>
          </div>

          <Link
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-secondary px-3 text-sm font-bold uppercase tracking-wide text-secondary-foreground transition-[background-color,scale] hover:bg-secondary-hover active:scale-[0.96]"
            to="/shop"
          >
            Boutique
          </Link>
        </Panel>
      </section>

      {message ? (
        <p className="rounded-md border border-border bg-card p-3 text-sm font-semibold text-subtle-foreground">
          {message}
        </p>
      ) : null}

      {inventoryEmpty ? (
        <Panel className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-lg font-black">Ton inventaire est presque vide.</p>
            <p className="mt-1 text-sm text-subtle-foreground">
              Dépense tes smotucoins à la boutique pour débloquer de nouveaux cosmétiques.
            </p>
          </div>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md bg-success px-4 text-sm font-bold uppercase tracking-wide text-success-foreground transition hover:bg-success-hover"
            to="/shop"
          >
            Ouvrir la boutique
          </Link>
        </Panel>
      ) : null}

      {EQUIP_SLOTS.map((slot) => {
        const items = (shop.inventory.ownedByCategory[slot] ?? [])
          .map((itemId) => shopItemById(itemId))
          .filter((item): item is ShopItem => Boolean(item))
          .sort((left, right) => left.sortOrder - right.sortOrder);

        if (items.length === 0) {
          return null;
        }

        return (
          <section className="space-y-4" key={slot}>
            <div>
              <SectionKicker>{EQUIP_SLOT_LABELS[slot]}</SectionKicker>
              <h3 className="mt-2 text-3xl font-black">
                {items.length} objet{items.length > 1 ? "s" : ""}
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                const equipped = shop.inventory.equipped[slot] === item.id;
                const previewAvatar = avatarWithItem(
                  shop.inventory.publicAvatar,
                  item,
                );

                return (
                  <Panel className="flex flex-col gap-4 p-4" key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <SectionKicker>{RARITY_LABELS[item.rarity]}</SectionKicker>
                        <h4 className="mt-2 text-balance text-xl font-black">
                          {item.name}
                        </h4>
                      </div>
                      {equipped ? (
                        <span className="rounded-full bg-success px-2 py-1 text-xs font-black text-success-foreground">
                          Équipé
                        </span>
                      ) : null}
                    </div>

                    <div className="flex justify-center">
                      {itemPreviewUsesAvatar(item) ? (
                        <AvatarDisplay
                          avatar={previewAvatar}
                          label={`Aperçu ${item.name}`}
                          size="xl"
                        />
                      ) : (
                        <ItemPreview item={item} />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {item.category === "confetti" ? (
                        <Button
                          size="sm"
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            setConfettiPreview({
                              burstKey: `${item.id}:${Date.now()}`,
                              skin: item.id,
                            })
                          }
                        >
                          Essayer
                        </Button>
                      ) : null}
                      {equipped ? (
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-black text-secondary-foreground">
                          Équipé
                        </span>
                      ) : (
                        <Button
                          disabled={Boolean(busyAction)}
                          size="sm"
                          type="button"
                          variant="success"
                          onClick={() => void equipItem(item)}
                        >
                          {busyAction === `equip:${item.id}` ? "Équipe..." : "Équiper"}
                        </Button>
                      )}
                    </div>
                  </Panel>
                );
              })}
            </div>
          </section>
        );
      })}

      <Panel className="space-y-4">
        <div>
          <SectionKicker>Indices</SectionKicker>
          <h3 className="mt-2 text-2xl font-black">Consommables</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {consumables.map((consumable) => (
            <div className="rounded-lg bg-muted p-4" key={consumable.label}>
              <p className="font-mono text-3xl font-black tabular-nums">
                {consumable.value}
              </p>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                {consumable.label}
              </p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
