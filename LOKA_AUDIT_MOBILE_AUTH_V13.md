# Loka V13 — Audit correctif mobile et destination après connexion

Date : 2026-10-19
Base : archive V12 fournie dans le contexte de travail.

## Problèmes utilisateur repris comme critères d'acceptation

1. La vue mobile ressemble à un desktop rétréci : marges incohérentes, navigation trop petite, hero et sections peu lisibles.
2. Les rails de la page d'accueil sont vides sans explication quand l'API renvoie des listes vides.
3. L'action Rechercher de la page d'accueil est vulnérable à un conflit de nom : la fonction locale `location(x)` masque `window.location`.
4. Après connexion réussie, l'utilisateur est ramené à la page marketing et ne dispose pas d'un véritable point d'entrée vers ses activités.
5. Le document HTML ne contient pas de déclaration viewport, ce qui empêche le navigateur mobile d'appliquer correctement les media queries et l'échelle attendue.

## Correctifs appliqués

- Ajout du document HTML complet, `lang="fr"`, charset, `meta viewport` avec `viewport-fit=cover`, couleur de thème, description et titre.
- Recomposition mobile-first de la page d'accueil : marges horizontales explicites, espacement cohérent, titre fluide, recherche empilée, CTA plein largeur, cartes/rails horizontaux, prise en compte des zones de sécurité et tailles tactiles adaptées.
- En desktop, largeur de contenu plafonnée, rythme de spacing fluide et rails multi-cartes.
- Ajout d'un état vide réutilisable par rail, avec une explication et un lien Explorer. Si l'API de découverte échoue, l'interface quitte l'état de chargement infini et présente l'erreur plus des états vides actionnables.
- Correction du bouton Rechercher : appel explicite à `window.location.assign(...)` au lieu de l'identifiant local `location`.
- Authentification : `returnTo` validé reste prioritaire ; sans destination explicite, un utilisateur normal arrive sur `/profil` et un administrateur sur `/pro`.
- Création d'une page `/profil` réellement routée, qui charge `GET /api/users/profil` avec le jeton, gère l'absence de session, expose des raccourcis vers les routes existantes et permet une déconnexion explicite.
- Ajustement des styles de la page de profil sur mobile et desktop, avec animations d'entrée et prise en charge de `prefers-reduced-motion`.
- Ajout d'un bouton de thème clair/sombre accessible aussi dans l'en-tête public, y compris sur mobile.

## Parcours utilisateur vérifiés statiquement

### Visiteur mobile
Accueil → recherche par saisie → recherche; si aucun résultat de découverte, message utile et CTA Explorer au lieu d'un vide inexpliqué.

### Utilisateur existant
Connexion réussie → destination `returnTo` sûre si fournie, sinon espace personnel `/profil` → activités accessibles → déconnexion → accueil public.

### Session expirée
Le gestionnaire de 401 déjà présent conserve la page demandée dans `returnTo`; après connexion, cette destination reprend la priorité.

### Professionnel / administrateur
Connexion avec rôle `admin` sans `returnTo` → `/pro`; les utilisateurs normaux ne sont pas envoyés arbitrairement vers l'espace d'administration.

## Contrôles exécutés

- Contrôle syntaxique TS/TSX avec l'API TypeScript `transpileModule` : **83 fichiers, 0 erreur de syntaxe**. Ce contrôle n'est pas un typecheck complet.
- Contrôle `node --check` backend : **148 fichiers, 0 erreur de syntaxe**.
- Contrôle des imports relatifs du frontend et intégrité ZIP effectués lors de la préparation de l'archive.
- Le build complet `npm run build` n'a pas pu être confirmé : `npm ci --ignore-scripts --no-audit --no-fund` a dépassé le délai disponible dans cet environnement. Pas de test E2E réel ni de capture navigateur générée.

## Limites et points à valider dans le déploiement

- Vérifier le rendu sur un vrai viewport de 360–430 px, tablette et desktop après déploiement GitHub Pages.
- Vérifier que les données API de découverte sont disponibles et que les liens des cartes retournées correspondent aux identifiants réels.
- Les pages métier restent à tester sur leurs flux de données réels ; ce correctif ne prétend pas certifier les commandes, réservations, paiements ou opérations de livraison.
- `/profil` utilise l'endpoint existant `GET /api/users/profil`. Les actions de réservation et de favoris ne sont pas présentées comme raccourcis tant que leurs pages client dédiées ne sont pas établies dans le routeur.


## Correctif déploiement CI (V13.1)

- Cause probable de l’échec `npm error Cannot read properties of null (reading 'edgesOut')` : `client/package-lock.json` était incomplet/incohérent : il ne contenait que le paquet racine et aucune entrée de dépendances.
- Suppression du lockfile incomplet afin que npm résolve un graphe de dépendances propre sur le runner.
- Workflow GitHub Actions aligné sur Node.js 22 et installation `npm install --no-audit --no-fund`.
- Limite : l’installation n’a pas pu être exécutée ici car l’accès réseau/dépendances a dépassé le délai. Le prochain run GitHub Actions doit confirmer la résolution et le build.
