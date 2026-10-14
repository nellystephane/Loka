# Loka — V18

Snapshot complet frontend + backend de Loka, conservant l'architecture réelle du dépôt.

## Architecture

```text
loka-main/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── client/                 # Frontend React/Vite → GitHub Pages
├── server/                 # Backend Node.js/Express/MongoDB → Render
├── package.json
├── .gitignore
└── README.md
```

## Déploiement

- Le workflow `.github/workflows/deploy.yml` déploie uniquement `client/` vers GitHub Pages.
- Le backend `server/` reste déployé par Render depuis le dépôt GitHub.
- Aucun nouveau workflow backend n'est ajouté.
- Le workflow GitHub Pages est conservé tel qu'il existait.

## Cohérence frontend/backend

- `Boutique`, `Restaurant`, `Hôtel`, `Livreur indépendant` et `Agence de livraison` restent les concepts métier utilisés.
- Le frontend ne doit pas inventer de nouveaux états métier absents du backend.
- Paiement confirmé et accomplissement métier restent distincts.
- Les réservations restaurant utilisent le namespace `/api/restaurants`.
- Les données professionnelles ne sont pas supprimées par un problème d'abonnement ou de paiement.

## V18

Cette version conserve la structure réelle du dépôt (`client/`, `server/`, `.github/workflows/deploy.yml`) et ajoute le premier socle du Storefront Builder : modèles structuraux, aperçu utilisant le même renderer que la vitrine publique, aperçu du parcours client, personnalisation d’accent et contrat de sauvegarde vers `/api/storefront`.


### V18 — première direction artistique réelle

Ajout du template `boutique_editorial` : une vitrine Boutique éditoriale/lifestyle avec composition asymétrique, typographie serif, photographie dominante, rythme magazine, sections narratives, responsive mobile-first et accent configurable. Le template est rendu par le même moteur que le Builder et reste distinct des autres structures.

## Passe suivante

Voir `docs/LOKA_REFONTE_PAGES_EXISTANTES_V3.md` pour les corrections de l’historique client et le contexte de navigation professionnel.
