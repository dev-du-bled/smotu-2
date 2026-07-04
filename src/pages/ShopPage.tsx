import { useState } from "react";
import type { ShopCategory, ShopState } from "../../shared/game";
import { AuthRequired } from "../components/AuthRequired";
import { Button, Panel, PointsAmount, SectionKicker, Skeleton } from "../components/ui";

const CATEGORY_LABELS: Record<ShopCategory, string> = {
  avatar: "Avatar",
  confetti: "Confetti",
  cosmetic: "Badge",
  hint: "Indice",
  theme: "Thème",
};

const CATEGORY_STYLES: Record<ShopCategory, string> = {
  avatar: "from-orange/25 to-warning/10 border-orange/40",
  confetti: "from-purple/25 to-primary/10 border-purple/40",
  cosmetic: "from-success/25 to-primary/10 border-success/40",
  hint: "from-warning/25 to-orange/10 border-warning/40",
  theme: "from-primary/25 to-success/10 border-primary/40",
};

export function ShopPage({
  authLoading = false,
  buy,
  loading,
  shop,
  signedIn,
}: {
  authLoading?: boolean;
  buy: (itemId: string) => Promise<ShopState>;
  loading: boolean;
  shop: ShopState;
  signedIn: boolean;
}) {
  const [busyItem, setBusyItem] = useState("");
  const [message, setMessage] = useState("");

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

  async function purchase(itemId: string) {
    setBusyItem(itemId);
    setMessage("");
    try {
      await buy(itemId);
      setMessage("Achat validé. Ton inventaire a été mis à jour.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Achat impossible.");
    } finally {
      setBusyItem("");
    }
  }

  const owned = new Set(shop.inventory.ownedItemIds);

  return (
    <div className="mx-auto min-h-[inherit] max-w-6xl space-y-6 px-4 py-8">
      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div>
          <SectionKicker>Boutique Smotucoin</SectionKicker>
          <h2 className="mt-2 text-4xl font-black">Cosmétiques et indices</h2>
          <p className="mt-3 max-w-3xl text-subtle-foreground">
            Les achats dépensent ton solde disponible, pas ton score de classement. La boutique propose maintenant des badges, avatars, thèmes, confettis de victoire et packs d'indices, avec des prix calés sur le mot du jour, le mode libre et Mastermind.
          </p>
        </div>
        <Panel className="space-y-3">
          <SectionKicker>Solde</SectionKicker>
          {loading ? <Skeleton className="h-10 w-32" /> : <PointsAmount className="text-4xl font-black" iconClassName="size-8" value={shop.inventory.balance} />}
          <p className="text-sm text-muted-foreground">
            Gagnés: {shop.inventory.lifetimeEarned.toLocaleString("fr-FR")} · Dépensés: {shop.inventory.lifetimeSpent.toLocaleString("fr-FR")}
          </p>
          <p className="text-sm text-muted-foreground">
            Indices lettre: {shop.inventory.hintLetterCount} · Positions: {shop.inventory.hintPositionCount} · Mastermind: {shop.inventory.hintMastermindCount}
          </p>
        </Panel>
      </section>

      {message ? <p className="rounded-md border border-border bg-card p-3 text-sm font-semibold text-subtle-foreground">{message}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && shop.items.length === 0
          ? Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-56" />)
          : shop.items.map((item) => {
              const alreadyOwned = owned.has(item.id) && !item.repeatable;
              const cannotAfford = shop.inventory.balance < item.price;
              return (
                <Panel
                  key={item.id}
                  className={`flex min-h-56 flex-col gap-4 bg-linear-to-br ${CATEGORY_STYLES[item.category]}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <SectionKicker>{CATEGORY_LABELS[item.category]}</SectionKicker>
                      <h3 className="mt-2 text-2xl font-black">{item.name}</h3>
                    </div>
                    {alreadyOwned ? <span className="rounded-full bg-success px-2 py-1 text-xs font-black text-success-foreground">Possédé</span> : null}
                  </div>
                  <p className="flex-1 text-sm text-muted-foreground">{item.description}</p>
                  <div className="flex items-center justify-between gap-3">
                    <PointsAmount className="text-2xl font-black" value={item.price} />
                    <Button
                      disabled={Boolean(busyItem) || alreadyOwned || cannotAfford}
                      type="button"
                      variant={item.category === "hint" ? "warning" : "success"}
                      onClick={() => void purchase(item.id)}
                    >
                      {busyItem === item.id ? "Achat..." : alreadyOwned ? "Possédé" : cannotAfford ? "Trop cher" : "Acheter"}
                    </Button>
                  </div>
                </Panel>
              );
            })}
      </div>
    </div>
  );
}
