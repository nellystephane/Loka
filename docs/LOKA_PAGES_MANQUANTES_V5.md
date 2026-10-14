# Loka — Pages manquantes V5

## Référence directrice

Document maître : `docs/ProxiConnect_UX_UI_Architecture_MVP_v1.docx`, sections 3, 7, 9, 17, 22, 23, 24 et 27. Cette passe traite deux destinations explicitement recensées dans la V4 : détail client d'une réservation et gestion des annonces publiées par le vendeur occasionnel.

## Pages créées / raccordées

### `/mes-annonces`
- Charge les annonces du compte via `GET /api/annonces/mes-annonces`.
- Présente le quota retourné par le backend lorsqu'il est disponible, le statut réel, le prix, la localisation, la date de publication et le lien public.
- Permet de modifier les champs existants via `PUT /api/annonces/:id`.
- Permet de mettre en pause / réactiver via le champ de statut existant, en respectant les valeurs du modèle (`actif`, `expiré`, `désactivé`). Une annonce dont la date d'expiration est passée n'est pas réactivable depuis cette action.
- Permet la suppression explicite via `DELETE /api/annonces/:id`, avec confirmation et rafraîchissement local.
- Ne prétend pas prolonger la durée de vie d'une annonce expirée et ne fabrique pas de statistiques de contacts/vues.

### `/reservation/:id`
- Résout une réservation d'hôtel via `GET /api/reservations/mes-reservations` ou une réservation de restaurant via `GET /api/restaurants/reservations/miennes`.
- N'affiche que les enregistrements présents dans les listes authentifiées du client. L'identifiant n'est pas recherché dans un endpoint public.
- Présente le statut métier, les dates, les détails connus et le statut de paiement séparément.
- Propose le lien de l'établissement quand sa référence est fournie.
- Les réservations ne proposent pas de bouton d'annulation côté client, car les routes présentes dans le backend n'exposent pas actuellement de transition client sécurisée. Aucune action non supportée n'est simulée.

## Intégration UX

- L'historique `/activites` renvoie maintenant les lignes de réservation vers le détail dédié au lieu de renvoyer vers la fiche établissement comme s'il s'agissait d'un détail de réservation.
- Le shell commun donne un accès « Mes annonces » dans la navigation client et un titre de page au détail de réservation.
- Les styles sont partagés avec les composants de compte, adaptatifs au mobile et au thème existant.

## Validation

- Tests backend/contrats : **39/39 PASS** (`npm --prefix server test`).
- Transpilation syntaxique TypeScript/TSX : **91 fichiers, 0 erreur de syntaxe**.
- Intégrité du ZIP vérifiée à la création.
- Le build complet Vite/TypeScript et les tests navigateur E2E restent à exécuter dans un environnement avec dépendances frontend complètes et base de données de test.

## Points encore à couvrir avant l'audit de bout en bout

- Page / navigation de catégories distincte, si elle reste une destination de premier plan ; aujourd'hui la recherche textuelle et les annuaires existent déjà.
- Fiche publique générique des services : le modèle courant est une annonce typée `service`, pas un modèle public séparé. Ne pas créer un doublon de modèle sans décision métier.
- Suivi complet des remboursements/litiges côté client, selon les endpoints et permissions disponibles.
- Audit runtime des transitions de livraison : acceptation, retrait validé, preuve de remise, livraison groupée et séparation des états paiement/métier.
- Validation navigateur mobile puis desktop de tous les parcours.

## Décision de méthode

Cette passe ajoute deux pages réelles en s'appuyant sur les endpoints et permissions existants. Elle ne constitue pas encore la clôture de toutes les pages manquantes ni l'audit fonctionnel final décrit dans le document maître.
