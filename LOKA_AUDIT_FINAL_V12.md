# Loka — Audit correctif V12 : navigation publique, paiement et médias

Date : 15 octobre 2026  
Base de travail : V11 + document maître UX/UI `ProxiConnect_UX_UI_Architecture_MVP_v1.docx`.

## Décision de qualité

Cette livraison corrige des risques transversaux observés pendant la revue du parcours visiteur/acheteur. Elle n'est pas déclarée certifiée en production : l'installation des dépendances frontend a expiré dans cet environnement, empêchant le build complet et les tests navigateur. Les critères non exécutés sont listés explicitement plus bas.

## Parcours relu du point de vue de l'utilisateur

### Visiteur sur GitHub Pages
- Il ouvre une fiche ou explore le catalogue, puis suit un lien interne vers recherche, connexion, messages ou réservation.
- Le site est servi sous `/Loka/`; un lien interne qui repart à `/connexion` ou `/checkout` à la racine du domaine provoquait une sortie du sous-chemin et une page 404.
- Correction : gestion déléguée des clics sur les liens internes absolus pour préserver `/Loka/`, sans toucher aux liens externes, liens `target=_blank`, téléchargements, modificateurs clavier/souris ou appels API. Les navigations directes courantes ont également été normalisées via `appPath`.

### Acheteur au paiement
- L'acheteur doit comprendre quels moyens sont réellement disponibles, ne jamais croire qu'un moyen choisi dans l'interface a été transmis si le backend ne le reçoit pas, et ne jamais voir une commande marquée réussie sans confirmation serveur.
- Correction : retrait du choix Mobile Money/carte non relié au payload backend; l'interface explique que FedaPay présente les moyens activés par sa configuration.
- Correction : ouverture de la fenêtre de paiement avant l'appel asynchrone pour réduire les blocages de popup des navigateurs mobiles; fermeture de la fenêtre si l'initialisation échoue.
- Correction : interrogation du statut bornée à cinq minutes, puis message de récupération explicite évitant d'inciter l'utilisateur à payer immédiatement une seconde fois.
- Correction : quand le backend confirme une commande, navigation vers la page de commande au lieu de modifier seulement l'URL avec `history.replaceState`, ce qui laissait l'interface sur l'écran de paiement.
- Garde-fou : la livraison ne peut pas être payée depuis ce checkout tant qu'aucun tarif réel n'est calculé. Le backend recevait auparavant `fraisLivraison: 0`, alors que l'écran disait que le coût restait à définir. Le parcours retrait/sans livraison reste disponible. Cette limite est volontairement visible plutôt que de facturer un total incomplet.

### Professionnel qui ajoute des photos
- Le document maître exige un sélecteur depuis la galerie, plusieurs photos, un logo unique, et un stockage fiable.
- Le `MediaPicker` et le `LogoPicker` de V11 restent partagés; cette tranche renforce la route d'upload pour refuser les SVG et autres types actifs non nécessaires. Formats autorisés : JPEG, PNG, WebP, GIF et AVIF, limite de taille existante 5 Mo.
- La durabilité du stockage dépend toujours de la configuration S3 compatible en production. Le stockage local Render est éphémère; cela doit être vérifié dans les variables Render avant de considérer les médias durables.

## Modifications V12

- `client/src/main.tsx` : normalisation des liens internes sous `/Loka/`.
- `client/src/pages/Home.tsx`, `Cart.tsx`, `Checkout.tsx`, `AnnonceDetail.tsx`, `ProfessionalDeliveryManager.tsx`, `StorefrontProductQuickView.tsx`, `StorefrontRenderer.tsx` : navigation directe courante préfixée avec `appPath`.
- `client/src/pages/commerce/Checkout.tsx` : flux popup, navigation après confirmation, polling limité, clarification du moyen de paiement et blocage explicite d'un total de livraison non calculé.
- `server/routes/uploadRoutes.js` : liste blanche de types MIME d'image.
- `client/src/styles/globals.css` : style responsive et glass léger pour l'information de paiement.

## Contrôles exécutés

- Transpilation syntaxique via l'API TypeScript globale : 82 fichiers TS/TSX/JS/JSX sous `client/src`, aucune erreur de syntaxe signalée.
- `node --check` : 148 fichiers JavaScript backend, aucune erreur de syntaxe.
- Résolution statique des imports relatifs frontend : aucun import local manquant détecté.
- Intégrité ZIP : contrôlée après création.
- `npm ci --no-audit --no-fund` frontend : délai dépassé dans l'environnement. Le build complet `tsc -b && vite build` n'a donc pas été confirmé.
- Tests serveur : non exécutés, car les dépendances serveur ne sont pas installées dans cet environnement.
- Tests E2E navigateur, téléphone réel, API Render, FedaPay Sandbox, SMTP, OAuth Google et redémarrage avec médias : non exécutés.

## Points qui restent à valider avant production

1. Exécuter le build frontend dans GitHub Actions et corriger toute erreur de typage/dépendance remontée.
2. Vérifier les liens et rafraîchissements directs sur les routes GitHub Pages sous `/Loka/`.
3. Tester en Sandbox un paiement approuvé, refusé, en attente et une reprise après délai; confirmer l'absence de double paiement.
4. Valider le calcul et la présentation des frais de livraison avant de réactiver le checkout avec livraison.
5. Configurer et tester S3/R2 avec `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` et `S3_URL_PUBLIQUE_BASE` si nécessaire.
6. Tester sélection, suppression et persistance des images sur un téléphone réel.
7. Finir l'intégration des médias dans les autres formulaires métier uniquement après confirmation des champs acceptés par les schémas backend.
8. Tester les parcours distincts boutique, restaurant, hôtel, livreur et agence sur mobile puis desktop, y compris droits et erreurs métier.
9. Résoudre les avertissements Mongoose d'index dupliqués et examiner les 9 vulnérabilités npm rapportées précédemment sans appliquer `npm audit fix --force` aveuglément.

## Correspondance avec le document maître

Cette tranche sert les exigences suivantes : mobile-first réel; conservation du contexte lors des transitions; paiement pending distinct d'un paiement confirmé; absence de succès fictif; médias sélectionnés depuis l'appareil; erreurs explicites; sécurité des médias; liens internes cohérents sous le déploiement GitHub Pages.
