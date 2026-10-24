# Loka — Core Consolidation V2

## Objectif
Passer simultanément sur les principaux parcours bloquants du MVP : commerce réel, réservations restaurant/hôtel, livraison réelle, messagerie réelle et vitrine publique data-driven.

## Fonctionnalités traitées

### Commerce
- Panier local basé sur des identifiants métier réels.
- Initialisation du paiement par le backend.
- Confirmation uniquement via statut transaction/webhook.
- Commande créée côté serveur après paiement approuvé.
- Consultation des commandes réelles.
- Création automatique de demande de livraison lorsque le contexte de commande le demande.

### Restaurant
- Réservation client chargée depuis le restaurant réel.
- Catégories d'emplacements chargées depuis MongoDB.
- Création de réservation côté backend.
- Paiement de réservation côté backend lorsque des frais existent.
- Confirmation uniquement après webhook.
- Gestion des réservations professionnelles branchée sur les réservations reçues.
- Correction : une table n'est plus marquée réservée opérationnellement avant confirmation du paiement.

### Hôtel
- Parcours client réel : hôtel → hébergement → dates → disponibilité physique → paiement → confirmation webhook.
- Disponibilité basée sur les unités physiques.
- Route de réservation publique dynamique par identifiant.

### Livraison
- Suivi d'une demande réelle par identifiant.
- Statuts chargés depuis le backend.
- Actions livreur : démarrage, route, arrivée.
- Validation du retrait par code.
- Validation de la remise par code.
- Historique et données financières affichés depuis la demande réelle.
- Anciennes interfaces de livraison de démonstration retirées des parcours actifs.

### Messagerie
- Liste des conversations depuis le backend.
- Chargement des messages réels.
- Envoi REST réel.
- Création d'une conversation depuis un contexte professionnel.
- Les vitrines peuvent ouvrir la messagerie Loka avec le contexte de l'espace.

### Vitrine
- Nouvelle API publique JSON `/api/storefront/public/:slug/data`.
- Données publiques chargées depuis l'espace réel.
- Produits/plats/hébergements chargés selon le métier.
- Route frontend `/vitrine/:slug`.
- Renderer adaptatif réel pour la vitrine publique de base.
- Les templates visuels existants restent séparés du moteur métier et ne sont pas considérés comme terminés/data-driven tant qu'ils n'ont pas été raccordés à ce contrat.
- Le Builder ne simule plus une publication réussie sans espace professionnel réel.

### Webhook
- Les erreurs internes du webhook FedaPay renvoient désormais une erreur HTTP afin de ne pas transformer un traitement métier échoué en événement considéré comme traité.

## Validation
- Syntaxe Node des contrôleurs/routes modifiés : OK.
- Tests backend disponibles : 2/2 OK.
- Build frontend : NON VALIDÉ dans cet environnement car les dépendances npm frontend ne sont pas installées ; `npm install` a dépassé le délai disponible.
- MongoDB/FedaPay réel : NON VALIDÉ dans cet environnement.

## État global
Le socle est avancé vers `FONCTIONNEL`, mais ne doit pas être déclaré `VALIDÉ` tant que les tests avec MongoDB, FedaPay/webhook réel, build frontend et parcours E2E n'ont pas été exécutés.
