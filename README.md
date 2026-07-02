# Smotu

Smotu est une réadaptation moderne du grand Smotu, le seul et l'unique selon
Codex, mais aussi selon Claude Code.

Un jeu de mot quotidien en cinq lettres, sobre, rapide, connecté et classé. Le
joueur retrouve l'esprit Wordle: six essais, des indices couleur, une grille du
jour et la satisfaction de gratter des points quand le mot tombe enfin.

## Ce que propose Smotu

- **Mot du jour**: une grille quotidienne, plus exigeante, plus rentable.
- **Mode libre**: des manches rejouables à volonté, jouables même sans compte
  (en invité, sans sauvegarde), pour continuer après le mot du jour.
- **Pseudo public**: chaque joueur choisit un pseudo affiché à la place de son
  nom de compte, y compris au classement.
- **Classement global**: les points des deux modes sont additionnés.
- **Profil joueur**: score, rang, victoires et photo Google quand disponible.
- **Propositions libres**: aucun dictionnaire ne bloque les mots saisis.
- **Interface responsive**: dark theme, header mobile, footer classique et
  modale de règles.
- **Déploiement simple**: une app React servie par Cloudflare Workers avec D1 en
  base de données.

## Règles du jeu

Le principe est direct: trouver un mot de cinq lettres en six essais.

| Couleur | Signification |
| --- | --- |
| Vert | Lettre bien placée |
| Jaune | Lettre présente ailleurs |
| Gris | Lettre absente |

Le mot du jour rapporte jusqu'à **900 points**. Le mode libre rapporte jusqu'à
**360 points** par victoire, mais il peut être rejoué sans limite.

## Pourquoi c'est sympa

Smotu ne cherche pas à être un gros produit. C'est un jeu court, lisible et
rejouable, avec juste assez de persistance pour donner envie de revenir:
continuer sa série, améliorer son rang, comparer les scores, puis relancer une
manche libre quand le mot du jour est plié.

## Stack

- React + React Router
- Tailwind CSS
- Better Auth pour l'auth Google et email/mot de passe
- Cloudflare Workers
- Cloudflare D1
- Drizzle ORM / Drizzle Kit
- TypeScript
- Vite + Cloudflare Vite plugin

## Architecture

```txt
src/
  components/       UI, header, footer, modale, grille de jeu
  game/             hooks React pour les modes de jeu et le profil
  pages/            pages routées côté React
  lib/              client API et utilitaires
worker/
  index.ts          API Cloudflare Worker
  db/schema.ts      schéma Drizzle D1
shared/
  game.ts           règles, types, scoring et logique de lettres
```

Les routes `/api/*` passent par le Worker. Le reste est servi comme une SPA
React. Le Worker initialise automatiquement les tables et index D1 nécessaires
au premier appel API.

## Lancer en local

```sh
npm install
npm run dev
```

Ouvre ensuite l'URL affichée par Vite, généralement:

```txt
http://localhost:5173
```

## Déployer sur Cloudflare

Créer une base D1 une seule fois:

```sh
wrangler d1 create smotu-db
```

Puis remplacer `database_id` dans `wrangler.jsonc` par l'id retourné par
Cloudflare.

Déployer:

```sh
npm run deploy
```

`npm run deploy` lance le build, applique les migrations D1 remote puis lance
`wrangler deploy`.

## Commandes utiles

```sh
npm exec tsc -- --noEmit
npm run build
npm run deploy
npm run db:generate
npm run db:push
npm run d1:migrate:local
npm run d1:migrate:remote
```

`db:generate`, `db:push` et les commandes `d1:migrate:*` restent disponibles
pour faire évoluer ou diagnostiquer le schéma.

Après le passage à Better Auth, applique les migrations D1 avant de déployer le
Worker:

```sh
npm run d1:migrate:local
npm run d1:migrate:remote
```

Pour remettre à zéro la D1 locale:

```sh
rm -rf .wrangler/state
```

## Authentification

Smotu utilise Better Auth pour la connexion Google et email/mot de passe. Les
sessions sont stockées dans D1 et lues côté Worker via les cookies Better Auth.

Les scores sont rattachés à un identifiant Smotu stable dérivé du compte Google
(`google:<sub Google>`), pas à l'identifiant interne Better Auth. Si un compte
Google recrée une session ou un utilisateur Better Auth, les données de jeu
continuent donc de pointer vers le même joueur.

Les comptes email utilisent l'identifiant Better Auth local (`auth:<id>`).

Si Google fournit une photo de profil, elle est affichée sur la page profil.

En production, configure les secrets suivants dans Cloudflare:

```sh
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

En local, `GOOGLE_SECRET_ID` est aussi accepté comme alias de
`GOOGLE_CLIENT_SECRET`.
