# Loka — Gate pré-vitrines

Source auditée : `loka-pre-vitrines-final.zip` (4 octobre 2026).

## Référence UX/UI

Le document maître UX/UI est la référence stricte pour les parcours : découverte, consultation, contact, achat/réservation, paiement, suivi, terminaison, évaluation/partage. Il impose un shell commun desktop/mobile, des états explicites, mobile-first, la continuité de contexte et un langage de motion cohérent.

## Travaux fermés dans cette passe

- navigation professionnelle reliée à des routes réelles ;
- vue professionnelle multi-espaces ;
- commandes professionnelles boutique + restaurant ;
- finances professionnelles : lecture du Ledger + historique des payouts + configuration payout ;
- abonnement professionnel : lecture des espaces/offres/statut + initiation FedaPay ;
- paramètres de compte persistés via API ;
- partage contextuel avec expansion + copie + partage natif ;
- suppression des références de démonstration dans le compositeur de propositions actif ;
- contact annonce contextualisé vers la messagerie Loka ;
- vérification du motion system commun et fallback `prefers-reduced-motion`;
- workflow GitHub Pages conservé sans modification fonctionnelle.

## Vérifications

- `npm --prefix server test` : **18/18 PASS** ;
- `node --check` sur tous les JS backend : **PASS** ;
- hash du workflow `.github/workflows/deploy.yml` : `790e2b07e750ef6d714801f10ecc4c752a0e706cc23e809bc0f2cfd2e2da8bcc`, inchangé ;
- build TypeScript/Vite local : **non certifié**, car les dépendances frontend ne sont pas installées dans l'environnement d'exécution ; les erreurs observées proviennent principalement de modules manquants (`react`, `lucide-react`, `vite`, etc.).

## Motion / UX vérifiés

- entrée de page ;
- succès ;
- changement d'état ;
- ouverture du viewer média ;
- réception/envoi chat ;
- feedback d'attente ;
- expansion du partage ;
- réduction de mouvement ;
- responsive mobile existant pour les parcours commerce/chat/livraison ;
- séparation des couleurs transactionnelles Loka et identités métier.

## Non déclaré comme validé

La validation finale nécessite encore un environnement connecté avec MongoDB/FedaPay et un navigateur pour exécuter les parcours réels de bout en bout sur mobile puis desktop. Les tests actuels sont des tests de contrat et de logique backend, pas un remplacement d'un E2E navigateur réel.

## Vitrines

Le socle data-driven est présent : API publique → données métier → `StorefrontRenderer`. Les templates existants contenant encore des données historiques sont volontairement conservés comme matériaux de conception ; ils ne constituent pas la validation de la vitrine finale. La phase suivante peut maintenant être la construction des vitrines, à condition de brancher chaque template au modèle métier réel et de conserver le même renderer pour preview et production.
