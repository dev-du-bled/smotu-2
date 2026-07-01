# Smotu

Smotu est une réadaptation du grand Smotu, le seul et l'unique selon Codex.

L'app reprend le principe du mot à deviner en cinq lettres, avec deux modes de
jeu, un classement global et une authentification Google via Shoo.

## Modes

- **Mot du jour** : une grille quotidienne, jusqu'à 900 points.
- **Mode libre** : des manches rejouables sans limite, jusqu'à 360 points par
  victoire.

Les propositions sont libres: tant que le mot fait cinq lettres, il est accepté.
Les cases vertes indiquent une lettre bien placée, les jaunes une lettre
présente ailleurs, les grises une lettre absente.

## Stack

- React
- React Router
- Tailwind CSS
- Shoo pour l'auth Google
- Cloudflare Workers + D1
- Drizzle ORM + Drizzle Kit
- TypeScript

## Lancer en local

```sh
npm install
npm run dev
```

Puis ouvrir `http://localhost:5173`.

Les routes `/api/*` passent par Cloudflare Workers, le reste est servi comme une
SPA React. Le schéma D1 est défini dans `worker/db/schema.ts`.

## Déploiement Cloudflare

Créer une base D1, puis remplacer `database_id` dans `wrangler.jsonc`:

```sh
wrangler d1 create smotu-db
```

Ensuite:

```sh
npm run db:generate
npm run d1:migrate:remote
npm run build
npm run deploy
```

## Commandes utiles

```sh
npm exec tsc -- --noEmit
npm run build
npm run db:generate
npm run db:push
npm run deploy
npm run d1:migrate:local
npm run d1:migrate:remote
```

`npm run db:push` utilise Drizzle Kit en mode D1 HTTP et attend
`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID` et `CLOUDFLARE_D1_TOKEN`.

Pour remettre à zéro la D1 locale, supprimer l'état local Wrangler:

```sh
rm -rf .wrangler/state
```
