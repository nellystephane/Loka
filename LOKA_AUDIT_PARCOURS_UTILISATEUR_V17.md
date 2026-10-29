# Loka V17 — Audit des parcours utilisateurs et correctifs de structure

## Périmètre de cette tranche
Cette livraison cible les défauts concrets remontés sur l'espace personnel, la création d'espace, l'identification des espaces professionnels, l'accès aux annonces et le retour à l'accueil après connexion. Elle ne prétend pas achever tous les métiers ni certifier la production.

## Référence métier
Le document maître demande notamment :
- un accueil qui ouvre sur la découverte locale et les annonces, et non un catalogue figé ;
- une vue d'ensemble professionnelle ;
- un catalogue/menu/chambres adapté au métier ;
- le parcours d'annonce : compte → activité → informations essentielles → présence → abonnement/paiement selon l'offre ;
- un panier multi-vendeurs ;
- une page Mon Espace et la création d'une activité réelle ;
- des pages publiques partageables et des actions métier liées à des données réelles.

## Corrections de cette version

### 1. Identifiants d'espaces professionnels `undefined`
**Cause constatée :** `getSpaces()` renvoyait des objets `{type, data}` alors que la vue d'ensemble et l'abonnement attendaient `id` et `name` au niveau supérieur. Cela explique les cartes « Identifiant undefined » et peut laisser la page Abonnement sans contenu.
**Correction :** normalisation des réponses des endpoints boutique, restaurant, hôtel, livreur et agence vers `{type, id, name, data}` ; la vue d'ensemble et les abonnements consomment maintenant cette forme normalisée.

### 2. Espace professionnel affiché sans espace créé
**Correction :** la vue d'ensemble propose désormais un vrai état « aucun espace » et un lien explicite vers `/mon-espace`, au lieu de présenter une agence préexistante. Les cartes existantes n'affichent plus d'identifiant technique tronqué comme information principale.

### 3. Création d'espace
**Correction :** ajout de `/mon-espace` avec liste des espaces réellement détectés et formulaire de création relié aux endpoints existants : `POST /api/boutiques`, `/api/restaurants`, `/api/hotels`, `/api/livreurs` et `/api/agences-livraison`. La création n'est pas simulée ; la réponse serveur est vérifiée puis la liste est rechargée.
**Limite connue :** les schémas de création diffèrent selon le métier. Cette première étape collecte le minimum accepté par les contrôleurs ; les profils métier doivent ensuite être complétés depuis les pages de gestion correspondantes. Les erreurs de validation du backend sont affichées.

### 4. Déposer une annonce
**Correction :** ajout de `/publier-annonce` et d'un bouton flottant sur les pages publiques. Le formulaire appelle `POST /api/annonces`, vérifie titre/description/catégorie, gère le prix gratuit et la localisation, et affiche les limites d'abonnement renvoyées par le serveur.
**Limite connue :** l'ajout de médias n'est pas encore intégré à ce formulaire. Le texte de la page le signale explicitement ; il ne prétend pas que les photos sont publiées. Les options d'annonce et les limites d'abonnement restent décidées par le backend.

### 5. Continuer à explorer après connexion
**Correction :** depuis la page d'accueil personnelle, « Continuer à explorer » revient maintenant à l'accueil public `/` plutôt qu'à `/recherche`. Le jeton n'est pas effacé. L'en-tête public connecté propose « Mon espace » au lieu de pousser l'utilisateur à se réinscrire.

### 6. Présentation mobile
Ajout d'une mise en page responsive dédiée aux pages Mon Espace et Publier une annonce : largeur de contenu bornée sur desktop, marges de 16 px sur téléphone, cartes repliables en colonnes, formulaire sans débordement, bouton flottant positionné au-dessus de la navigation basse et respect de `prefers-reduced-motion`.

## Parcours simulés par inspection
- Visiteur connecté sans espace → Espace professionnel → état vide → Mon Espace → choisir métier → soumettre création → relire la liste réelle.
- Utilisateur connecté → bouton flottant → formulaire d'annonce → validation → `POST /api/annonces` → détail de l'annonce créée.
- Utilisateur non connecté → publier annonce → invitation à se connecter avec `returnTo=/publier-annonce`.
- Utilisateur connecté sur Mon Espace → retour à l'accueil → session conservée.
- Utilisateur avec un espace → vue d'ensemble et abonnement utilisent le même identifiant normalisé.

## Audit des écrans restants (non clos)
Ces points de la remontée initiale ne doivent pas être considérés comme résolus par V17 :
- Messages : rendu, liste de conversations, états vide/erreur, ouverture d'une conversation et envoi de message à tester.
- Catalogue : sélection de l'espace quand plusieurs espaces existent, création de catégories, aperçu vidéo/photo et adaptation restaurant/hôtel encore à auditer.
- Commandes : filtre par espace et libellés par activité encore à mettre en place/valider.
- Finances : configuration de versement par méthode et sauvegarde serveur à tester.
- Abonnement : vérifier offres, statut, choix d'espace, et comportement lorsque aucun espace n'existe.
- Vitrine : sélection d'espace, sauvegarde, aperçu client, publication et couleurs encore à auditer.
- Paramètres : CGU, mentions légales, confidentialité, déconnexion et préférences.
- Panier : confirmer présence du point d'entrée dans la navigation, persistance, panier multi-vendeurs, livraison et calcul fiable.
- Annonces : médias depuis galerie, liste/gestion de mes annonces, modification, suppression, expiration, contact/messages, vues et limites d'abonnement.
- Accueil : vérifier que les annuaires (boutiques, restaurants, hôtels, livreurs/agences), annonces et promotions disposent de rails avec « Voir tout » adaptés aux données réellement disponibles.
- Authentification/session : E2E login, inscription, Google, lien e-mail, expiration 401, retour à l'intention initiale et route directe sous `/Loka/`.
- Styles globaux, animations et glassmorphism restent reportés à la phase visuelle dédiée, comme demandé.

## Vérifications techniques réellement réalisées
- Revue statique des fichiers modifiés et correspondance des routes avec les endpoints déjà montés dans `server/routes/index.js`.
- L'installation npm a dépassé le délai disponible dans l'environnement de travail. Par conséquent, **aucun build Vite/TypeScript complet ni test E2E navigateur n'est revendiqué pour V17**.
- Avant production : exécuter `cd client && npm ci && npm run build`, puis tester sur mobile et desktop avec au moins un compte sans espace et un compte possédant plusieurs espaces.
