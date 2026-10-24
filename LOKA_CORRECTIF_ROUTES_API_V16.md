# Loka V16 — Correction des routes GitHub Pages et diagnostic API

## Symptômes signalés
- Les pages autres que l'accueil répondent 404 après navigation/retour.
- L'accueil affiche « Failed to fetch » lors du chargement de données.

## Correctif implémenté
1. `client/public/404.html` intercepte les routes profondes non connues de GitHub Pages, conserve chemin/query/hash, puis redirige vers `/Loka/` avec un paramètre temporaire.
2. `client/index.html` restaure l'URL demandée via `history.replaceState` avant le démarrage du module React. Le routeur existant reçoit ainsi la vraie route (ex. `/Loka/profil`) au premier rendu.
3. Le préfixe `/Loka/` est conservé, conforme à `vite.config.ts` (`base: '/Loka/'`). GitHub Actions déploie `client/dist`, et Vite copie `client/public/404.html` à la racine de cet artefact.

## Cause distincte de « Failed to fetch »
Le fallback 404 corrige le routage du frontend, mais ne peut pas corriger à lui seul un échec réseau de l'API. Le client utilise `https://proxiconnect.onrender.com` par défaut et le workflow fournit `VITE_API_URL` à la compilation. Le backend autorise `https://nellystephane.github.io` par défaut dans `CORS_ORIGINS`.

Si « Failed to fetch » persiste après redéploiement, il faut distinguer :
- service Render en veille/démarrage ou indisponible ;
- backend qui ne répond pas / crash ;
- erreur CORS si `CORS_ORIGINS` sur Render ne contient pas exactement `https://nellystephane.github.io` ;
- appel API ou endpoint incorrect.

Je n'ai pas pu appeler Render depuis cet environnement (DNS/réseau externe indisponible). Je ne déclare donc pas l'API validée.

## Contrôles
- Inspection statique du chemin de déploiement Vite/GitHub Actions et du préfixe `/Loka/`.
- Contrôle de cohérence du fallback et du script de restauration.
- Build Vite complet et vérification réelle sur navigateur mobile non exécutés dans cet environnement.

## Test de réception obligatoire
1. Déployer via GitHub Actions.
2. Ouvrir directement `https://nellystephane.github.io/Loka/profil` et `.../Loka/connexion`, puis actualiser : la page doit se restaurer, sans 404.
3. Sur l'accueil, ouvrir DevTools > Network (ou les outils réseau du navigateur) et relever l'URL et le message de l'appel qui échoue si « Failed to fetch » persiste.
4. Dans Render, vérifier que `CORS_ORIGINS` contient `https://nellystephane.github.io` sans chemin `/Loka/` et que le service est `Live`.
