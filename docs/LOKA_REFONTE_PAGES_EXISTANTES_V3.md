# Loka — Poursuite de la refonte des pages existantes (V3)

## Référence

Document maître : `ProxiConnect_UX_UI_Architecture_MVP_v1.docx` (15 septembre 2026). Cette passe reste dans la phase « pages existantes » : elle améliore les écrans déjà routés sans prétendre combler les pages autonomes manquantes, qui feront l'objet de la phase suivante.

## Corrections effectuées

1. **Historique des activités client**
   - Les quatre sources existantes (commandes boutique, commandes restaurant, réservations hôtel, réservations restaurant) sont chargées indépendamment.
   - Une indisponibilité partielle est maintenant signalée sans masquer les autres résultats.
   - L'action d'actualisation permet de rejouer le chargement.
   - Les lignes de réservation ne renvoient plus vers `/activites` comme si cette même page était leur détail. Elles proposent d'ouvrir l'établissement lorsque sa référence est disponible ; le détail de réservation reste à créer dans la phase « pages inexistantes ».
   - Aucune date artificielle n'est substituée à une date manquante.

2. **Contexte professionnel visible**
   - `/pro/catalogue?espaceType=restauration` affiche « Menu du restaurant » dans l'en-tête commun.
   - `/pro/catalogue?espaceType=hotel` affiche « Chambres et hébergements ».
   - L'alias client `/app` est identifié comme l'accueil dans le shell et active l'entrée Accueil.

3. **Cohérence des titres de navigation**
   - Les fiches publiques de boutique, restaurant, hôtel, plat, annonce et livreur disposent d'un titre de shell plus précis.
   - Les routes de réservation ont priorité sur les titres génériques de fiche établissement.

## Tests et limites

- Tests backend/contrats : **32/32 PASS** (`npm --prefix server test`).
- Contrôles `node --check` sur les fichiers JavaScript backend/testés : PASS.
- Build complet TypeScript/Vite : **non validé** ; `npm --prefix client ci --ignore-scripts --no-audit --no-fund` a dépassé le délai de l'environnement et les dépendances ne sont pas disponibles localement.
- Tests navigateur/E2E : non exécutés.

## Points explicitement reportés à la phase « pages inexistantes »

- Détail autonome d'une réservation client, avec statut et prochaines actions réels.
- Inventaire final et création des destinations réellement absentes après rapprochement de toutes les routes avec le document maître.
- Parcours de test de bout en bout dans un environnement configuré, mobile puis desktop.
