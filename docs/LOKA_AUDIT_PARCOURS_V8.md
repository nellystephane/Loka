# Loka — Fermeture des écarts de couverture V8

## Référence de contrôle

Document maître : `docs/ProxiConnect_UX_UI_Architecture_MVP_v1.docx`, notamment les sections 6, 10, 12, 13, 17–20, 22, 24–26.

Cette passe ferme au niveau du code et des tests contractuels les lacunes citées dans le rapport V7. Elle ne prétend pas remplacer une compilation complète, un test navigateur ni un test FedaPay sandbox.

## Fermeture des points V7 cités

### Navigation mobile — raccordée

- La barre inférieure conserve quatre destinations prioritaires adaptées au contexte.
- Le bouton « Plus » ouvre un panneau accessible avec les destinations client et découverte, ou les destinations professionnelles / administration selon le contexte.
- Le panneau expose l’état actif, permet de le fermer et fournit un accès aux favoris, notifications, support, remboursements, catégories, annuaires et destinations professionnelles.
- Le shell conserve la navigation desktop complète.

### Partage — raccordé

- Le composant partagé propose WhatsApp, Facebook, X, Instagram (copie du lien puis ouverture du service), TikTok (copie du lien puis ouverture du service), QR code, copie et partage natif.
- Les interactions sont instrumentées dans les événements analytiques et les statistiques de partage lorsque la cible est une entité prise en charge.
- Le QR code est généré par un service tiers externe ; l'interface l'indique explicitement. La disponibilité du service QR dépend donc du réseau et du fournisseur.

### Apprentissage progressif — événements supplémentaires raccordés

- Le shell enregistre les vues de pages et la répétition de consultation dans une session.
- Les pages de détail annonce/service, produit, plat et vitrine enregistrent aussi la consultation de l'entité concernée.
- La recherche, le panier, les achats, les réservations, les contacts, les partages et les livraisons terminées sont instrumentés sur leurs parcours actifs.
- La page catégories mesure l'exposition effective d'une tuile (IntersectionObserver + seuil d'exposition), le clic et l'exposition ignorée. Le backend accepte ces trois types : `category_impression`, `category_click`, `category_ignored`. Les répétitions pourront être agrégées côté analyse ; une exposition ignorée n'est pas interprétée isolément comme une préférence certaine.

### Storefront Builder — checklist réellement calculée

- Informations essentielles : nom, description et ville de l'espace.
- Contenu : au moins un produit en stock, plat disponible ou hébergement disponible selon le métier.
- Modèle : vérification contre les templates autorisés par le plan.
- Publication : bloquée côté UI tant que la checklist échoue, et contrôlée à nouveau côté serveur avec vérification de propriété, plan actif et disponibilité du contenu.
- L'aperçu réutilise le renderer des vitrines. Les données métier ne sont pas copiées dans les templates.

### Livraison groupée — contrôles UI et serveur renforcés

- Le parcours permet de sélectionner entre deux et quinze demandes éligibles appartenant au compte, avec adresses de retrait et de destination complètes.
- Le serveur rejette les demandes déjà affectées, modifiées en concurrence, dupliquées ou ne correspondant pas au propriétaire autorisé ; les mises à jour partielles sont compensées par un rollback applicatif.
- Les frais fixes sont validés dans l'interface : le total de mission suit le total des allocations, et le bouton de création reste désactivé si les montants divergent.
- Une mission proposée doit être acceptée par le livreur avant démarrage.
- Les arrêts se valident dans l'ordre et chacun requiert une preuve structurée (code, photo, signature ou note avec référence/note obligatoire). La mission ne se clôt qu'une fois tous les arrêts validés.

## Ajustements de robustesse

- Les erreurs de chargement de vitrine par slug ou par identifiant sont maintenant présentées de façon explicite au lieu de rendre silencieusement un renderer vide.
- Les vues d'entités publiques sont instrumentées à partir des données réellement chargées.
- Le frontend déclare des versions directes explicites pour React, React DOM, Vite, le plugin React, TypeScript, Lucide et les types. L'ancien `package-lock.json` ne contenait pas les résolutions et a été retiré plutôt que de laisser croire à un lockfile valide. `npm install` doit générer le lockfile complet dans l'environnement de build avant `npm run build`.

## Contrôles réalisés

- Tests backend et contractuels : **63/63 PASS** (`npm --prefix server test`).
- Transpilation syntaxique TypeScript/TSX avec le compilateur TypeScript disponible : **96 fichiers, 0 erreur de syntaxe**. Cela ne remplace pas le type-check complet.
- Syntaxe Node du serveur : à vérifier sur l'environnement de build final ; les contrôleurs touchés dans cette passe n'ont pas changé leur syntaxe métier.
- Build frontend `tsc -b && vite build` : **non exécuté avec succès**, car les dépendances ne sont pas installées dans l'environnement. Le manifeste utilise maintenant des versions directes épinglées ; l'installation réseau et la génération du lockfile doivent être faites dans l'environnement de build.
- Parcours navigateur E2E, responsive/accessibilité manuels et FedaPay sandbox : **non exécutés**.

## Points qui restent à valider en environnement réel

Ces points ne sont pas des lacunes de navigation déclarées comme corrigées ; ce sont des validations d'intégration impossibles à certifier par inspection seule :

1. Installation complète (`npm install`), génération du lockfile et build TypeScript/Vite.
2. Parcours navigateur mobile et desktop, avec comptes dédiés à chaque rôle et états loading/empty/error/pending/success.
3. FedaPay sandbox : webhook idempotent, paiement approuvé/échoué, remboursements partiels, échecs et rapprochement du ledger.
4. Livraison groupée sur base de test : vérifier les mises à jour corrélées des commandes/demandes sources, notifications, rémunérations, échecs et reprises. Les contrôles de mission et de preuve existent, mais la cohérence multi-modèle doit être prouvée en intégration.
5. Accessibilité manuelle (clavier, focus, lecteur d'écran), petites largeurs d'écran, thème clair/sombre et réseau faible.

## Résultat

Les cinq familles de lacunes citées dans la réponse V7 — navigation mobile, partage, événements d'apprentissage, checklist de publication et parcours de livraison groupée — sont présentes et testées au niveau du code/contrat. L'application ne doit toutefois pas être déclarée « sans aucun manque » avant le build et les parcours d'intégration ci-dessus.
