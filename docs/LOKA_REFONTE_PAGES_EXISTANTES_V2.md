# Loka — Poursuite de la refonte des pages existantes (V2)

## Référence produit

Cette passe suit le document maître UX/UI & Architecture fonctionnelle, en particulier :
- une seule plateforme et un shell commun ;
- une navigation compréhensible selon le rôle ;
- mobile-first, sans supprimer les chemins desktop ;
- séparation des contextes métier (boutique, restaurant, hôtel, livraison) ;
- états backend comme source de vérité.

## Corrections effectuées dans cette passe

1. **Shell desktop plus explicite** : passage d'une barre latérale d'icônes seules à une navigation libellée, regroupée par espace, tout en conservant le shell commun.
2. **Découverte publique accessible** : liens directs vers les annuaires boutiques, restaurants, hôtels, livreurs/agences et la publication d'annonce.
3. **Navigation professionnelle** : l'accès aux réservations est distinct de celui des commandes et est exposé dans la navigation.
4. **Correction des destinations métier** : depuis la vue d'ensemble, les raccourcis restaurant et hôtel ouvrent le bon contexte de gestion (`espaceType=restauration` ou `espaceType=hotel`) au lieu de retomber par défaut sur le catalogue boutique.
5. **Mobile conservé** : navigation inférieure compacte et styles responsive conservés ; les liens d'exploration supplémentaires restent accessibles depuis l'accueil et le shell desktop.

## Pages existantes couvertes par le routage actuel

- Découverte : `/`, `/recherche`, `/boutiques`, `/restaurants`, `/hotels`, `/livreurs`.
- Contenus publics : `/annonce/:id`, `/produit/:id`, `/plat/:id`, `/boutique/:id`, `/restaurant/:id`, `/hotel/:id`, `/livreur/:id`, `/vitrine/:slug`.
- Compte : `/connexion`, `/inscription`, `/verification-email`, `/verification-email/renvoyer`, `/mot-de-passe-oublie`, `/reset-password`, `/profil`, `/favoris`, `/notifications`, `/activites`, `/messages`.
- Professionnel : `/pro`, `/pro/nouvelle-activite`, `/pro/catalogue`, `/pro/commandes`, `/pro/reservations`, `/pro/clients`, `/pro/livraisons`, `/pro/livraisons/agence`, `/pro/livraisons/boutique`, `/pro/livraisons/restaurant`, `/pro/messages`, `/pro/finances`, `/pro/abonnement`, `/pro/vitrine`, `/pro/parametres`.
- Transactionnel : `/panier`, `/checkout`, `/commande/:id`, `/livraison`, `/livraison/:id`, réservation restaurant et hôtel.
- Administration : `/admin`, `/admin/utilisateurs`, `/admin/litiges`, `/admin/payouts`.

> La présence d'une route et d'un écran ne signifie pas que le parcours complet est validé. La validation fonctionnelle nécessite un environnement frontend/backend configuré et des données de test.

## Pages/parcours à créer ou compléter dans la phase « pages inexistantes »

Le document maître exige certaines destinations qui ne sont pas encore des pages autonomes clairement couvertes :

- une page dédiée aux catégories, si la catégorie doit être une destination de navigation indépendante ;
- une fiche publique de service distincte d'une fiche produit/plat lorsque le modèle métier le nécessite ;
- une page de détail de réservation (les lignes de l'historique de réservation renvoient encore à l'historique global) ;
- un espace explicite de gestion des annonces publiées par le vendeur occasionnel ;
- les écrans de suivi/validation métier manquants après vérification du parcours de livraison réel ;
- les pages de litige/remboursement et l'historique financier client/professionnel si les API existantes les rendent nécessaires.

Cette liste est un relevé préliminaire de routes et de destinations visibles dans le code, pas une décision de réduire le MVP. Elle sera confirmée contre chaque parcours métier lors de l'audit suivant.

## Vérification de cette passe

- Tests contractuels backend : **30/30 réussis** avec `npm --prefix server test`.
- Contrôles syntaxiques Node sur les contrôleurs/routes modifiés : réussis.
- Transpilation syntaxique TypeScript/JSX des fichiers modifiés (`AppShell.tsx`, `ProfessionalOverview.tsx`) : réussie.
- Build complet TypeScript/Vite : non validé. L'installation frontend (`npm ci`) a expiré et les dépendances React/Vite restent indisponibles dans cet environnement.
- Aucun test navigateur E2E n'est déclaré effectué.
