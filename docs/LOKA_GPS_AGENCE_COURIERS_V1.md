# Loka — proximité GPS réelle et recherche de livreurs par agence

## Ce qui est implémenté

### Annuaire livreurs — proximité GPS
- L'accueil demande la permission de géolocalisation uniquement après clic sur « Trouver près de moi ».
- L'API `GET /api/livreurs?lat=...&lng=...&rayonKm=50` calcule la distance Haversine entre la position de l'utilisateur et les coordonnées réelles enregistrées dans `User.localisation.latitude/longitude`.
- Les profils géolocalisés sont classés par distance croissante ; les profils sans coordonnées sont placés après les profils mesurables et n'affichent aucune distance inventée.
- La recherche est limitée au rayon demandé (1 à 200 km, 50 km par défaut). En l'absence de permission ou de position, le parcours explique le problème et l'utilisateur peut toujours continuer la découverte générale.
- Les coordonnées ne sont pas déduites de la ville ou du quartier. Un profil existant sans latitude/longitude ne sera donc pas présenté comme géolocalisé.

### Agence — recherche et rattachement de livreurs
- Nouvel endpoint authentifié `GET /api/agences-livraison/moi/livreurs/candidats?q=`.
- Recherche par nom, téléphone, ville et zones déclarées.
- Exclusion des livreurs déjà rattachés à l'agence.
- Les candidats affichent disponibilité, transport, zones et missions actives. Les candidats déjà engagés sont désactivés dans l'interface.
- Rattachement via l'endpoint existant, avec rechargement du profil et de la liste après réussite.

## Fichiers principaux
- `server/controllers/livreurController.js`
- `server/controllers/agenceLivraisonController.js`
- `server/routes/agenceLivraisonRoutes.js`
- `server/models/User.js`
- `client/src/pages/Home.tsx`
- `client/src/pages/delivery/DeliveryAgency.tsx`
- `client/src/services/delivery.ts`
- `client/src/styles/globals.css`

## Vérifications
- `node --check` des contrôleurs, routes et modèle modifiés : réussi.
- Tests backend : 20/20 réussis.
- Build complet frontend et tests E2E navigateur : non exécutés dans cette passe, car les dépendances frontend ne sont pas installées dans cette archive.

## Conditions de mise en production
1. Les utilisateurs/livreurs doivent disposer de coordonnées réelles, collectées avec consentement et persistées dans `localisation.latitude/longitude`.
2. Il faut prévoir dans le parcours de profil la saisie ou la mise à jour de ces coordonnées ; la présente modification ne géocode pas automatiquement les adresses.
3. Le calcul est une distance à vol d'oiseau, pas un temps de trajet ni une distance routière.
4. Le rattachement existant devrait être durci davantage côté serveur pour refuser explicitement les profils suspendus et empêcher qu'un même livreur rejoigne plusieurs agences si telle est la règle métier retenue.
