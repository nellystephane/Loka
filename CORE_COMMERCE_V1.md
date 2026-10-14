# Loka — Core Commerce V1

## Objectif
Brancher le parcours commerce réel sur le moteur paiement existant, sans créer de faux succès côté frontend.

## Ce bloc couvre
- panier sans données de démonstration persistées ;
- panier avec identifiants métier réels (`produitId`, `boutiqueId`, `restaurantId`, `platId`) ;
- détail produit public réel via `GET /api/produits/:id` ;
- ajout au panier depuis un produit réel ;
- initialisation du paiement via `POST /api/paiements-commande/initier` ;
- ouverture du checkout FedaPay créé par le backend ;
- polling de l'état local de transaction ;
- commande affichée uniquement après confirmation serveur/webhook ;
- page commande chargée depuis les commandes réelles du client ;
- références de commande générées côté backend ;
- endpoint privé de statut de paiement.

## Ce qui reste volontairement non prétendu comme terminé
- calcul réel des frais de livraison dans le checkout client ;
- parcours restaurant complet (menu réel → panier restaurant → paiement) ;
- panier multi avec interface de regroupement métier complète ;
- remboursement de bout en bout côté UI ;
- tests MongoDB/FedaPay réels ;
- validation de build frontend dans cet environnement ;
- connexion complète du StorefrontRenderer adaptatif aux données réelles.

## Règle de vérité
Le frontend ne crée ni ne confirme une commande. Il initialise le paiement, puis attend l'état serveur. La commande est matérialisée par le traitement du webhook FedaPay.
