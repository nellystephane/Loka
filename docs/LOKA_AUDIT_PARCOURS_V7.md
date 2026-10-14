> **Statut : remplacé par V8.** Les lacunes citées en V7 (navigation mobile, partage, événements d’apprentissage, checklist du Storefront Builder et contrôles de livraison groupée) ont été recontrôlées et raccordées dans `docs/LOKA_AUDIT_PARCOURS_V8.md`. Les réserves d’intégration restent ouvertes tant que le build et les parcours navigateur ne sont pas exécutés.

# Loka — Inventaire des routes et audit de parcours V7

## Référence obligatoire

Document maître : `docs/ProxiConnect_UX_UI_Architecture_MVP_v1.docx` (15 septembre 2026), en particulier sections 3–4, 7–10, 11, 17–20, 22–27.

Cette passe ajoute des destinations manquantes et corrige des écarts concrets trouvés par inspection du code. Elle ne vaut pas certification E2E : aucun environnement de navigateur connecté à une base de test et à FedaPay sandbox n'a été disponible.

## Corrections effectuées dans cette passe

### Découverte et navigation

- Ajout de `/categories`, alimenté par `GET /api/recherche/categories`. Les catégories et leurs nombres sont calculés à partir des annonces encore actives, produits disponibles et plats disponibles réellement publics.
- Ajout de l'alias public `/service/:id`, réutilisant la fiche d'annonce/service existante sans dupliquer le modèle métier.
- Correction du conflit de nom dans l'accueil : l'aide de formatage de localisation masquait l'objet navigateur `location` et pouvait empêcher l'envoi du formulaire de recherche. La navigation utilise maintenant `window.location`.
- Les cartes de livreurs de l'accueil utilisent désormais les données du profil utilisateur réellement rattaché.
- Le badge de mise en avant de l'accueil ne présente plus automatiquement tout espace sans abonnement actif comme « Pro ».
- La priorité d'abonnement dans le classement de découverte est bornée et ne domine plus à elle seule les signaux de fraîcheur et de mise en avant.

### Publication et contenu public

- La visibilité d'une vitrine est désormais lue depuis `StorefrontConfig.publie`, conformément à la séparation du document maître entre statut professionnel, abonnement et publication de vitrine.
- Les résultats de découverte et de recherche n'incluent plus les produits archivés/indisponibles, les annonces expirées, ni les produits/plats dont l'espace parent n'a pas de vitrine publiée.
- Les pages de catalogue produit/plat et leurs fiches publiques appliquent les mêmes contrôles de publication.
- La fiche annonce/service interprète correctement le prix structuré (`prix.montant`), la localisation structurée et l'identifiant du créateur.
- Une annonce inactive ou expirée est masquée au public ; son créateur authentifié conserve l'accès à sa propre fiche pour gérer son contenu.
- Les fiches de produit et les vitrines ne présentent plus un produit en rupture comme ajoutable au panier.

### Support et finances

- Ajout de `/litiges` : création d'un signalement et historique des dossiers du compte via les routes authentifiées existantes.
- Ajout de `/remboursements` : choix d'un paiement approuvé appartenant au compte, calcul du montant restant, dépôt d'une demande et historique des demandes.
- Ajout des lectures authentifiées `GET /api/remboursements/transactions/miennes` et `GET /api/remboursements/moi`.
- Le backend sérialise les demandes de remboursement par transaction avec un verrou court afin d'éviter que deux demandes concurrentes dépassent ensemble le montant payé.
- L'interface distingue explicitement une demande enregistrée d'un remboursement réellement confirmé par le prestataire. Elle ne présente pas le dépôt de la demande comme un succès financier final.

### Livraison

- Le changement générique de statut ne permet plus de passer directement de `en_cours` à `en_route` sans le code de retrait.
- Le retrait exige une course démarrée et le code attendu. La remise exige un retrait préalablement validé.
- La validation de remise enregistre une preuve structurée de type `code_remise` si aucune preuve explicite n'est fournie ; le suivi expose la validation de remise.

## État de couverture des routes de référence

| Parcours du document maître | État de route | Réserve principale |
|---|---|---|
| Accueil, recherche, catégories | Présents | Parcours navigateur non exécuté |
| Annonce, service, produit/plat | Présents | Vérifier le contact et les états en runtime |
| Vitrine boutique/restaurant/hôtel | Présents | Vérifier templates, plan actif et publication en E2E |
| Connexion, inscription, vérification, récupération | Présents | Tests d'intégration email/session requis |
| Activités, messages, favoris, notifications, profil | Présents | Parcours complet non rejoué en navigateur |
| Panier, checkout, commande, suivi livraison | Présents | Sandbox FedaPay et tests E2E indispensables |
| Onboarding et pages professionnelles | Présents | Tester chaque type d'espace et chaque transition |
| Litiges client | Présent dans cette passe | Traitement admin et retour au client à tester en E2E |
| Demandes de remboursement | Présent dans cette passe | Confirmation distante FedaPay non simulée en test runtime |
| Livraison : retrait, trajet, arrivée, remise | Routes présentes et transition de retrait renforcée | Preuve, notification, rémunération et cas d'échec à rejouer avec DB de test |

## Écarts encore ouverts — à ne pas déclarer terminés

1. **Build frontend reproductible** : `client/package-lock.json` ne contient actuellement que le manifeste racine (pas les résolutions complètes de React, Vite, Lucide et TypeScript). L'installation des dépendances a expiré dans cet environnement ; le build complet `tsc -b && vite build` échoue faute de modules installés. Il faut régénérer le lockfile dans un environnement réseau fiable, installer les dépendances, puis corriger les erreurs TypeScript réelles révélées par ce build.
2. **Parcours client de bout en bout** : découverte → détail → contact/négociation → panier → paiement → commande → livraison → évaluation/partage à exécuter sur navigateur, avec états de chargement, vide, erreur et reprise réseau.
3. **Livraison groupée** : le modèle accepte le type `groupée`, mais le parcours complet multi-retraits, allocation des frais, preuves par destination et clôture doit être démontré par tests intégrés avant validation.
4. **Storefront Builder** : vérifier chaque template disponible avec les vraies données du propriétaire, le plan actif, la checklist, l'aperçu public identique et la publication. Les anciens composants de conception basés sur `client/src/data/demo.ts` ne sont pas branchés dans le renderer actif, mais restent dans le dépôt ; leur statut d'archive doit être décidé pour éviter une réutilisation accidentelle.
5. **Remboursement** : les pages et les lectures sont présentes ; la confirmation finale dépend encore de la réponse FedaPay. Il faut tester demandes partielles, demandes concurrentes, échec du prestataire, répétition webhook et rapprochement du ledger.
6. **Rôles métier** : exécuter séparément les parcours boutique, restaurant, hôtel, vendeur occasionnel, livreur indépendant, agence et administration avec comptes de test dédiés. Les tests contractuels seuls ne prouvent pas les permissions et les transitions sur une base réelle.
7. **Responsive et accessibilité** : validation manuelle mobile/desktop, navigation clavier, tailles tactiles, thème clair/sombre, états de focus et réduction de mouvement.

## Contrôles réalisés dans cette passe

- Tests backend et contrats : **52/52 PASS** (`npm --prefix server test`).
- Syntaxe Node : **149 fichiers JavaScript, 0 erreur**.
- Transpilation syntaxique TypeScript/TSX : **94 fichiers, 0 erreur de syntaxe** (ce contrôle ne remplace pas le type-check complet).
- Build Vite/TypeScript complet : **non validé**, dépendances frontend absentes/incomplètes.
- Tests navigateur E2E et FedaPay sandbox : **non exécutés**.

## Ordre de travail suivant

1. Restaurer un lockfile frontend reproductible et obtenir un build complet.
2. Exécuter le parcours client de bout en bout et corriger chaque écart observé.
3. Exécuter les parcours métier un par un, en commençant par boutique et restaurant, puis hôtel, vendeur occasionnel, livreur indépendant, agence et administration.
4. Terminer la livraison groupée et les transitions/proofs manquantes seulement après confirmation des règles métier du document maître.
5. Rejouer les tests après chaque correction et produire une matrice finale « exigence → route/page → endpoint → test → résultat ».
