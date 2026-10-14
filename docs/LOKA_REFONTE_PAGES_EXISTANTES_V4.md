# Loka — Clôture de la passe de refonte des pages existantes (V4)

## Référence directrice

La référence fonctionnelle est `docs/ProxiConnect_UX_UI_Architecture_MVP_v1.docx` (15 septembre 2026). Cette passe respecte notamment : un shell unique selon le rôle, les contextes métiers explicites, les états de chargement/erreur/attente, la séparation paiement/accomplissement métier et le principe mobile-first.

## Corrections de cette passe

1. **Entrée Réservations professionnelle unifiée**
   - `/pro/reservations` propose un choix d'espace métier lorsqu'un compte a un restaurant, un hôtel ou les deux.
   - Le contexte restaurant ouvre le gestionnaire de réservations de tables.
   - Le contexte hôtel ouvre le dashboard hôtelier directement sur l'onglet Réservations.
   - Les états et transitions propres à chaque moteur restent distincts.

2. **Abonnement professionnel ciblé sur le bon espace**
   - L'interface transmet l'identifiant de l'espace sélectionné lors de l'initialisation du paiement.
   - Le backend recherche cet espace avec son propriétaire ; il ne sélectionne plus arbitrairement le premier espace de ce type quand un identifiant est fourni.
   - Une absence de réponse sur le statut d'abonnement est affichée comme indisponibilité, et non comme preuve qu'aucun abonnement n'existe.
   - Si le navigateur bloque l'ouverture d'un nouvel onglet de paiement, une navigation de secours est prévue.

3. **Résilience des commandes reçues**
   - Les commandes boutique et restaurant sont chargées indépendamment.
   - Si un seul moteur est indisponible, les résultats de l'autre restent affichés et un avertissement identifie la source manquante.
   - Si les deux sources échouent, l'écran présente une erreur récupérable plutôt qu'un faux état vide.

4. **Calendrier hôtelier**
   - La date initiale utilise la date locale du navigateur plutôt qu'une date UTC susceptible de décaler le jour affiché.

5. **Continuité et états**
   - Les actions de reprise sont exposées dans les états d'erreur des parcours professionnels concernés.
   - Les contrats ajoutés couvrent la sélection de l'espace d'abonnement, la résilience des commandes et l'entrée réservation métier.

## Inventaire de couverture des routes existantes

| Domaine | Routes déjà raccordées |
|---|---|
| Découverte | `/`, `/app`, `/recherche`, `/boutiques`, `/restaurants`, `/hotels`, `/livreurs` |
| Fiches publiques | `/annonce/:id`, `/produit/:id`, `/plat/:id`, `/boutique/:id`, `/restaurant/:id`, `/hotel/:id`, `/livreur/:id`, `/vitrine/:slug` |
| Authentification et compte | `/connexion`, `/inscription`, `/verification-email`, `/verification-email/renvoyer`, `/mot-de-passe-oublie`, `/reset-password`, `/profil`, `/favoris`, `/notifications`, `/activites`, `/messages` |
| Professionnel | `/pro`, `/pro/nouvelle-activite`, `/pro/catalogue`, `/pro/commandes`, `/pro/reservations`, `/pro/clients`, `/pro/livraisons`, `/pro/livraisons/agence`, `/pro/livraisons/boutique`, `/pro/livraisons/restaurant`, `/pro/messages`, `/pro/finances`, `/pro/abonnement`, `/pro/vitrine`, `/pro/parametres` |
| Flux | `/panier`, `/checkout`, `/commande/:id`, `/livraison`, `/livraison/:id`, réservation restaurant, réservation hôtel |
| Administration | `/admin`, `/admin/utilisateurs`, `/admin/litiges`, `/admin/payouts` |

La liste décrit les routes branchées, pas une certification de tous les scénarios réels. Les pages sont maintenant raccordées au même système de navigation et les écarts fonctionnels connus sont listés ci-dessous pour la phase suivante.

## Pages ou destinations encore à créer/compléter — phase suivante

- Détail autonome de réservation client, avec statut serveur et actions autorisées.
- Destination indépendante des catégories, si elle est retenue comme page de navigation distincte.
- Fiche de service public distincte du produit/plat, lorsque le modèle métier le requiert.
- Gestion des annonces publiées par le vendeur occasionnel (liste, modification, expiration et suppression autorisée).
- Pages de détail client pour remboursements/litiges et historique complet des opérations lorsque les contrats backend le permettent.
- Écrans manquants du parcours de livraison après validation de bout en bout : assignation, acceptation, retrait validé, preuve de remise et livraison groupée.

Ces éléments ne sont pas masqués par des redirections artificielles ; ils seront confirmés dans l'inventaire des pages inexistantes et traités avant l'audit complet des parcours.

## Vérifications réalisées

- Tests backend/contrats : **36/36 PASS** (`npm --prefix server test`).
- `node --check` sur le contrôleur de paiement et le fichier de test : PASS.
- Transpilation syntaxique TypeScript/TSX de **89 fichiers** : PASS.
- Intégrité ZIP : vérifiée après création de l'archive finale.

## Limites de validation explicites

- Le build TypeScript/Vite complet n'a pas été exécuté : l'installation des dépendances frontend a dépassé le délai disponible. Le lockfile frontend fourni est minimal et ne contient pas les résolutions complètes des dépendances.
- Aucun parcours navigateur/E2E n'est déclaré comme testé dans cette passe.
- Les tests contractuels vérifient le raccordement et les invariants statiques ; ils ne remplacent pas un test avec base de données, prestataire de paiement et comptes de test.

## Étape suivante selon le plan

1. Inventorier et créer les destinations manquantes listées ci-dessus sans doublonner les pages déjà présentes.
2. Préparer des comptes et données de test pour chaque rôle.
3. Auditer d'abord sur mobile puis desktop : nouveau client, boutique, restaurant, hôtel, livreur indépendant, agence de livraison et administration.
4. Confronter chaque étape au document maître, noter les écarts, corriger, puis rejouer les parcours.
