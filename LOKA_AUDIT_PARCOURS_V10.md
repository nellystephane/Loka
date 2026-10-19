# Loka — Audit V10 : session, authentification, médias et parcours

Date : 15 octobre 2026
Base : archive V9 + document maître `ProxiConnect_UX_UI_Architecture_MVP_v1.docx`.
But : traiter les prochains blocages transversaux avant d'ajouter de nouvelles pages métier.

## 1. Parcours utilisateur simulés par rôle

### A. Visiteur qui découvre Loka pour la première fois (mobile)
- Il arrive sur `/Loka/` sans session : le layout public est présenté, pas le shell professionnel.
- Il cherche un produit ou un établissement : les appels de découverte/recherche ciblent maintenant l'API Render par défaut au lieu d'envoyer `/api/...` sur GitHub Pages.
- Il ouvre une carte publique : les liens des cartes partagées respectent le sous-chemin `/Loka/`.
- Il veut créer un compte : il accède à une vraie page d'inscription. Après réponse positive de l'API, Loka lui demande de confirmer son e-mail et ne stocke pas la session prématurément.

### B. Utilisateur qui revient après expiration de session
- Une requête avec un Bearer token qui reçoit HTTP 401 nettoie `token` et `loka_user`.
- L'utilisateur est renvoyé vers `/Loka/connexion` avec un message de session expirée et un `returnTo` local pour revenir à la page demandée après reconnexion.
- Une erreur 401 sans en-tête Bearer (par exemple un mot de passe incorrect) n'est pas interceptée par ce mécanisme.
- Les routes `/pro...` sans jeton sont redirigées vers la connexion, en conservant la route visée.

### C. Utilisateur qui confirme son adresse ou réinitialise son mot de passe
- `/verification-email?token=...` appelle le endpoint backend de confirmation et affiche un état succès ou erreur récupérable.
- En cas de lien de confirmation invalide/expiré, il peut ouvrir `/renvoyer-confirmation`.
- `/reset-password?token=...` propose le nouveau mot de passe, vérifie la longueur et la confirmation, puis appelle `POST /api/users/password/reset`.
- Les liens générés côté serveur retirent maintenant les slashs finaux de `FRONTEND_URL`, afin d'éviter les doubles slashs.

### D. Professionnel qui ajoute un produit depuis son téléphone
- Le formulaire de création produit n'exige plus une URL de photo saisie à la main.
- Le composant partagé `MediaPicker` ouvre le sélecteur natif de photos/fichiers, vérifie le type et la limite de 5 Mo, montre un aperçu, permet de retirer une photo, d'en ajouter jusqu'à 8, puis téléverse les images sur `/api/upload`.
- Le composant `LogoPicker` réutilise le même flux avec une limite d'un fichier.
- Le téléversement requiert un token ; si la session est invalide, le mécanisme transversal de session s'applique.

## 2. Corrections réalisées

- API Render comme origine par défaut dans les services frontend et les pages de découverte, recherche et livraisons qui avaient encore une base vide.
- Configuration Vite avec `base: '/Loka/'` pour le déploiement GitHub Pages du dépôt projet.
- Workflow GitHub Actions : passage des secrets `VITE_GOOGLE_CLIENT_ID` et `VITE_FEDAPAY_PUBLIC_KEY` au build ; ajout de `VITE_API_URL` explicite.
- Intégration Google Identity Services sur la page de connexion si `VITE_GOOGLE_CLIENT_ID` est présent. L'ID token reçu est envoyé à `POST /api/users/google`; le backend reste chargé de le vérifier avec `GOOGLE_CLIENT_ID`.
- Pages de confirmation d'e-mail, de réinitialisation finale du mot de passe et de renvoi du lien.
- `FRONTEND_URL` utilisé pour les e-mails doit être `https://nellystephane.github.io/Loka` (sans slash final). `CORS_ORIGINS` doit rester une origine sans chemin : `https://nellystephane.github.io`.
- Les cartes partagées normalisent leurs liens internes pour le sous-chemin GitHub Pages.
- Les modales et sheets gardent maintenant une courte transition de fermeture et respectent `prefers-reduced-motion`.
- Le shell traite les routes non reconnues comme publiques par défaut ; seules les familles de routes explicitement privées affichent le shell connecté. Le professionnel sans session est redirigé vers la connexion.

## 3. Configuration à confirmer dans GitHub / Render

GitHub repository → Settings → Secrets and variables → Actions :
- `VITE_GOOGLE_CLIENT_ID` : Client ID OAuth Web public de Google (pas le Client Secret).
- `VITE_FEDAPAY_PUBLIC_KEY` : clé publique FedaPay Sandbox.

Render backend :
- `GOOGLE_CLIENT_ID` : même Client ID OAuth Web que le frontend.
- `FRONTEND_URL=https://nellystephane.github.io/Loka` (sans slash final).
- `CORS_ORIGINS=https://nellystephane.github.io`.
- SMTP : l'utilisateur indique que la configuration est déjà faite ; elle n'a pas été modifiée dans cette tranche.

Google Cloud : origine JavaScript autorisée `https://nellystephane.github.io`. Aucun redirect URI OAuth n'est nécessaire pour le flux Google Identity Services qui transmet un ID token au backend. La configuration doit être vérifiée avec le Client ID réellement utilisé dans le build.

## 4. Contrôles exécutés

- Transpilation syntaxique TypeScript/TSX via TypeScript `transpileModule` : 82 fichiers inspectés, 0 diagnostic syntaxique.
- `node --check` sur les fichiers JavaScript backend : aucune erreur de syntaxe.
- Contrôle des routes ajoutées et des références aux nouveaux composants effectué statiquement.
- Intégrité ZIP à contrôler après génération.

## 5. Limites explicites — pas certifié production

- `npm install` a expiré dans cet environnement ; le build Vite/TypeScript complet n'a donc pas été exécuté avec les dépendances installées.
- Aucun test navigateur réel ni test E2E n'a été exécuté.
- L'authentification Google est implémentée côté frontend mais doit être testée avec les origines et le Client ID configurés dans Google Cloud et le backend Render.
- `MediaPicker` est intégré au formulaire de création de produit. `LogoPicker` est disponible comme composant réutilisable, mais il reste à le brancher dans chaque formulaire métier qui gère un logo.
- Le stockage local des uploads du serveur peut être éphémère sur Render. Pour des photos durables en production, le stockage S3 compatible déjà prévu par le backend doit être configuré et vérifié.
- Les parcours boutique, restaurant, hôtel, livreur et agence doivent encore être testés de bout en bout métier par métier ; cette livraison ne revendique pas que toutes les pages métier sont désormais conformes.

## 6. Prochaine tranche recommandée

1. Déployer le build GitHub Actions et confirmer que les assets se chargent sous `/Loka/`.
2. Tester inscription → e-mail → confirmation → connexion, connexion Google, mot de passe oublié → reset.
3. Tester le scénario token invalide sur plusieurs actions métier, pas uniquement sur une page.
4. Tester ajout/suppression de photos sur téléphone et confirmer que les URL restent accessibles après redémarrage backend.
5. Auditer chaque parcours métier de la découverte à la transaction, sur mobile et desktop, avec les états vide/chargement/erreur/succès et transitions d'ouverture/fermeture.
