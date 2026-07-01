# Smotu

Smotu est une réadaptation du grand Smotu, le seul et l'unique selon Codex.

L'app reprend le principe du mot à deviner en cinq lettres, avec deux modes de
jeu et un classement global.

## Modes

- **Mot du jour** : une grille quotidienne, jusqu'à 900 points.
- **Mode libre** : des manches rejouables sans limite, jusqu'à 360 points par
  victoire.

Les propositions sont libres: tant que le mot fait cinq lettres, il est accepté.
Les cases vertes indiquent une lettre bien placée, les jaunes une lettre
présente ailleurs, les grises une lettre absente.

## Stack

- Lakebed
- Preact
- TypeScript

## Lancer en local

```sh
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000`.

Pour simuler plusieurs joueurs en local:

```txt
http://localhost:3000/?lakebed_guest=alice
http://localhost:3000/?lakebed_guest=bob
```

## Commandes utiles

```sh
npm exec tsc -- --noEmit
npm run build
npx lakebed deploy --json
```

La DB locale Lakebed est en mémoire: redémarrer `npm run dev` la remet à zéro.
