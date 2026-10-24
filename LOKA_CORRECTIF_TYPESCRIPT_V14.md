# Loka — Correctif de compilation TypeScript V14

## Erreurs signalées

- `TS7026` (`JSX.IntrinsicElements` absent) et `react/jsx-runtime` sans déclaration : les types React n'étaient pas déclarés dans `client/package.json`.
- `TS7006` sur le paramètre `r` et `TS2322` sur `key` : erreurs en cascade dues principalement à l'absence des types JSX/React. Elles doivent être revalidées après installation.
- `TS2339` sur `ImportMeta.env` dans `apiConfig.ts` et `fedapay.ts` : déclaration de types Vite manquante.

## Correctifs appliqués

- Ajout de versions cohérentes et fixées pour React 18, React DOM, Vite, TypeScript et le plugin React.
- Ajout de `@types/react`, `@types/react-dom` et `@types/node` en dépendances de développement.
- Ajout de `client/src/vite-env.d.ts` avec la référence `vite/client`.
- Déclaration explicite des types Vite dans `tsconfig.app.json`.

## Validation

- Inspection des fichiers de configuration : effectuée.
- Tentative de régénération du lockfile avec npm : non terminée, l'accès au registre npm a dépassé le délai de cet environnement.
- Build `npm run build` : non exécuté avec les dépendances complètes ; il reste obligatoire dans GitHub Actions.

## À faire après intégration

1. Remplacer les fichiers correspondants dans le dépôt `Loka`.
2. Dans GitHub Actions, garder `npm install --no-audit --no-fund` tant qu'aucun `package-lock.json` complet et vérifié n'est commité.
3. Relancer le workflow. Si `TS7006` ou `TS2322` persistent après l'installation des types React, corriger ces erreurs spécifiques au lieu de les masquer avec `any` ou en désactivant `strict`.

Aucun changement n'a été fait pour désactiver la vérification TypeScript ou contourner la compilation.
