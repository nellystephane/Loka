# Loka V23 — Spectrum Index

V23 continues the art-directed storefront series with a deliberately different composition from Pop Object.

## New template
- `boutique_spectrum_index`
- Product catalogue presented as a numbered editorial index.
- Deep ultramarine / electric cyan / tangerine / butter palette.
- New split-poster hero and vertical catalogue architecture.
- Contextual product sheet styled specifically for the template.

## Product interaction
V23 also fixes the product-detail gap identified during testing:
- product entries are clickable;
- a contextual modal/product sheet opens;
- the product sheet includes image, price, description, colors, sizes/formats, details and optional ingredients;
- close by button, backdrop or Escape;
- mobile layout is responsive;
- the visual treatment changes by storefront template instead of using one generic modal everywhere.

The shared component is:
`client/src/components/storefront/StorefrontProductQuickView.tsx`

Boutique templates wired to it:
- Editorial
- Neo Flux
- Orbit Glass
- Float Form
- Pop Object
- Spectrum Index

The generic storefront renderer also opens product details for its standard Boutique / Restaurant / Hôtel catalogue cards.

## V23 preview prompt
`V23_HTML_PREVIEW_PROMPT.md` is the standalone prompt for generating/testing the concept as a single HTML file on a phone.

## Workflow
The existing `.github/workflows/deploy.yml` was not changed.
Backend remains under `server/` and is deployed through the existing Render setup.

## Mise à jour V24 — Catalogue adaptatif

Le système de boutique a été mis à jour pour séparer les données commerciales de la composition des vitrines.

Nouveaux éléments :
- `server/models/CategorieBoutique.js`
- `server/models/CollectionBoutique.js`
- attributs/tags/collections/categorieId dans `Produit`
- `server/controllers/catalogueBoutiqueController.js`
- `server/routes/catalogueBoutiqueRoutes.js`
- `/api/catalogue-boutique/schema`
- `/api/catalogue-boutique/profile`
- `/api/catalogue-boutique/categories`
- `/api/catalogue-boutique/collections`
- page `client/src/pages/pro/BoutiqueCatalogManager.tsx`
- service `client/src/services/catalogue.ts`

Le formulaire est progressif : essentiel → variantes → caractéristiques → organisation. Les « nouvelles arrivées » et autres sections de vitrine ne sont pas des champs obligatoires du formulaire ; elles sont dérivées des données disponibles.

Le workflow GitHub Pages n'est pas modifié. Le backend reste destiné au déploiement Render.
