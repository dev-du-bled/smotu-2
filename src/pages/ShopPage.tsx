import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  DEFAULT_SHOP_EQUIPMENT,
  type PublicAvatar,
  type ShopCategory,
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
import { cn } from "../lib/utils";

const SECTION_TONE: Record<ShopCategory, string> = {
  avatar: "border-orange/40 bg-orange/10",
  hat: "border-warning/45 bg-warning/10",
  shirt: "border-success/45 bg-success/10",
  confetti: "border-primary/20 bg-primary/5",
  theme: "border-success/35 bg-success/10",
  hint: "border-warning/45 bg-warning-muted/70",
};

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

export function ShopPage({
  authLoading = false,
  buy,
  equip,
  loading,
  shop,
  signedIn,
}: {
  authLoading?: boolean;
  buy: (itemId: string) => Promise<ShopState>;
  equip: (slot: ShopEquipSlot, itemId: string) => Promise<ShopState>;
  loading: boolean;
  shop: ShopState;
  signedIn: boolean;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [busyAction, setBusyAction] = useState("");
  const [confettiPreview, setConfettiPreview] = useState<{
    burstKey: string;
    skin?: ShopItemId;
  }>({ burstKey: "" });
  const [message, setMessage] = useState("");
  const owned = useMemo(
    () => new Set(shop.inventory.ownedItemIds),
    [shop.inventory.ownedItemIds],
  );
  // L'onglet actif est piloté par l'URL (?section=...) pour permettre les
  // deep-links depuis le header ; repli sur le premier onglet si invalide.
  const requestedSection = searchParams.get("section");
  const section =
    shop.sections.find((item) => item.id === requestedSection) ??
    shop.sections[0];
  const items = shop.items
    .filter((item) => item.category === section.id)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  if (!signedIn) {
    return (
      <AuthRequired
        loading={authLoading}
        title={authLoading ? "Verification de ta session." : "Connecte-toi pour ouvrir la boutique."}
        description="La boutique utilise tes smotucoins gagnés en jeu sans toucher au classement."
        eyebrow="Boutique"
      />
    );
  }

  async function purchase(item: ShopItem) {
    setBusyAction(`buy:${item.id}`);
    setMessage("");
    try {
      await buy(item.id);
      setMessage(item.slot ? "Achat validé et équipé." : "Achat validé.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Achat impossible.");
    } finally {
      setBusyAction("");
    }
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

  return (
    <div className="mx-auto min-h-[inherit] max-w-6xl space-y-6 px-4 py-8">
      <ConfettiBurst
        burstKey={confettiPreview.burstKey}
        skin={confettiPreview.skin}
      />
      <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div>
          <SectionKicker>Boutique Smotucoin</SectionKicker>
          <h2 className="mt-2 text-balance text-4xl font-black">Boutique</h2>
          <p className="mt-3 max-w-3xl text-pretty text-subtle-foreground">
            Avatars 3D, accessoires, thèmes et effets de victoire sont rangés par
            sections. Les achats modifient ton inventaire sans retirer de points au
            classement.
          </p>
        </div>

        <Panel className="space-y-5">
          <div className="flex items-center gap-4">
            <AvatarDisplay
              avatar={shop.inventory.publicAvatar}
              label="Avatar équipé"
              size="lg"
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

          {/* Le détail de l'équipement et des consommables vit sur /inventory. */}
          <Link
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-secondary px-3 text-sm font-bold uppercase tracking-wide text-secondary-foreground transition-[background-color,scale] hover:bg-secondary-hover active:scale-[0.96]"
            to="/inventory"
          >
            Mon inventaire
          </Link>
        </Panel>
      </section>

      {message ? (
        <p className="rounded-md border border-border bg-card p-3 text-sm font-semibold text-subtle-foreground">
          {message}
        </p>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {shop.sections.map((item) => (
          <button
            className={cn(
              "h-10 shrink-0 rounded-md px-3 text-sm font-black transition-[background-color,color,box-shadow,transform] active:scale-[0.96]",
              item.id === section.id
                ? "bg-primary text-primary-foreground shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_6px_16px_rgb(0_0_0/0.12)]"
                : "bg-card text-subtle-foreground hover:bg-card-hover",
            )}
            key={item.id}
            type="button"
            onClick={() => setSearchParams({ section: item.id }, { replace: true })}
          >
            {item.title}
          </button>
        ))}
      </div>

      <section className="space-y-4">
        <div>
          <SectionKicker>{section.title}</SectionKicker>
          <h3 className="mt-2 text-balance text-3xl font-black">{section.title}</h3>
          <p className="mt-2 text-pretty text-subtle-foreground">{section.description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading && shop.items.length === 0
            ? Array.from({ length: 6 }, (_, index) => (
                <Skeleton className="h-72" key={index} />
              ))
            : items.map((item) => {
                const alreadyOwned = owned.has(item.id);
                const equipped =
                  item.slot && shop.inventory.equipped[item.slot] === item.id;
                const cannotAfford = shop.inventory.balance < item.price;
                const previewAvatar = avatarWithItem(
                  shop.inventory.publicAvatar,
                  item,
                );
                const actionDisabled =
                  Boolean(busyAction) ||
                  (alreadyOwned && !item.repeatable && !item.slot) ||
                  (!alreadyOwned && cannotAfford);

                return (
                  <Panel
                    className={cn(
                      "flex min-h-72 flex-col gap-4 p-4",
                      SECTION_TONE[item.category],
                    )}
                    key={item.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <SectionKicker>{RARITY_LABELS[item.rarity]}</SectionKicker>
                        <h4 className="mt-2 text-balance text-2xl font-black">
                          {item.name}
                        </h4>
                      </div>
                      {equipped ? (
                        <span className="rounded-full bg-success px-2 py-1 text-xs font-black text-success-foreground">
                          Équipé
                        </span>
                      ) : alreadyOwned ? (
                        <span className="rounded-full bg-secondary px-2 py-1 text-xs font-black text-secondary-foreground">
                          Possédé
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

                    <p className="flex-1 text-pretty text-sm text-muted-foreground">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <PointsAmount className="text-2xl font-black" value={item.price} />
                      <div className="flex flex-wrap gap-2">
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
                        {alreadyOwned && item.slot && !equipped ? (
                          <Button
                            disabled={Boolean(busyAction)}
                            size="sm"
                            type="button"
                            variant="secondary"
                            onClick={() => void equipItem(item)}
                          >
                            {busyAction === `equip:${item.id}`
                              ? "Équipe..."
                              : `Équiper ${EQUIP_SLOT_LABELS[item.slot]}`}
                          </Button>
                        ) : (
                          <Button
                            disabled={actionDisabled || Boolean(equipped)}
                            size="sm"
                            type="button"
                            variant={item.category === "hint" ? "warning" : "success"}
                            onClick={() => void purchase(item)}
                          >
                            {busyAction === `buy:${item.id}`
                              ? "Achat..."
                              : equipped
                                ? "Équipé"
                                : alreadyOwned && !item.repeatable
                                  ? "Possédé"
                                  : cannotAfford
                                    ? "Trop cher"
                                    : "Acheter"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Panel>
                );
              })}
        </div>
      </section>
    </div>
  );
}
