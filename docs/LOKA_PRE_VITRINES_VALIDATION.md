# Loka — Validation pré-vitrines

## Référence
Le document maître UX/UI & Architecture fonctionnelle est la référence stricte.

## Blocs fermés dans cette passe

- découverte publique alimentée par `/api/discovery/home`;
- recherche `/recherche` + API `/api/recherche`;
- routes publiques métier par identifiant réel;
- vitrine publique par espace réel;
- données privées du Builder chargées depuis le backend;
- publication Builder refusée sans contexte professionnel réel;
- commandes boutique/restauration avec état `confirmée` après webhook;
- états de commande prolongés jusqu'à `terminée`;
- correction du hook Mongoose de `CommandeRestaurant`;
- dashboard agence connecté aux missions et aux livreurs réels;
- affectation d'un livreur d'agence contrôlée par appartenance à l'agence;
- historique de mission visible dans le tracking;
- propositions structurées dans la messagerie avec objets `Offre` / `OffreLivraison`;
- paiement d'une offre de commande depuis le chat;
- acceptation/refus d'une proposition de livraison;
- motion système partagé + respect de `prefers-reduced-motion`;
- disparition des données fictives des parcours publics actifs.

## UX/UI / motion

Contrôles effectués par rapport au document maître :

- mobile-first;
- shell Loka distinct des identités des vitrines;
- action principale claire;
- loading / empty / error / pending / success;
- continuité de contexte;
- paiement distinct de l'accomplissement métier;
- suivi de livraison avec états serveur;
- bottom/overlay patterns existants pour les tâches secondaires;
- transitions courtes et directionnelles;
- feedback de succès et changement d'état;
- animation désactivée lorsque l'utilisateur demande une réduction de mouvement;
- aucune animation ne doit être nécessaire pour comprendre ou terminer une tâche.

## Tests exécutés

- syntaxe Node de tous les fichiers backend : PASS
- TypeScript `tsc --noEmit` : PASS
- tests Node backend : 12/12 PASS
- build Vite complet : NON CERTIFIÉ dans cet environnement (l'exécution `npx vite build` a dépassé le délai)
- MongoDB/FedaPay réel : NON CERTIFIÉ sans environnement connecté
- navigateur E2E réel : NON CERTIFIÉ dans cet environnement

## Règle de passage aux vitrines

Les vitrines finales peuvent maintenant être traitées sur un socle métier beaucoup plus propre. Elles doivent cependant continuer à respecter :

`données métier → modèle normalisé → renderer → vitrine`

Aucun template ne doit réintroduire des données métier fictives ni sa propre logique de commande, réservation, paiement ou livraison.
