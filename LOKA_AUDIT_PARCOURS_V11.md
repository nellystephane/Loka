# Loka — Audit V11 : continuité des parcours métier et identité de vitrine

Date : 15 octobre 2026  
Base : V10 + document maître UX/UI.  
But : continuer les fondations transversales, sans déclarer les parcours métier complets avant les tests de bout en bout.

## 1. Parcours revus avec le point de vue de l'utilisateur

### Visiteur / acheteur (mobile)
1. Arrive sans session : doit comprendre qu'il est sur la place de marché publique, pas dans un back-office.
2. Explore ou recherche un produit / établissement, puis ouvre une fiche publique.
3. Si une action exige un compte, il doit être invité à se connecter sans perdre l'intention de départ.
4. Ajoute au panier ou commence une réservation, vérifie le récapitulatif, puis poursuit le paiement.
5. Après confirmation, il doit retrouver sa commande/réservation et son état réel côté serveur.

**Contrôles statiques :** routes publiques et routes commerce présentes dans `router.tsx`; `AppShell` distingue les routes publiques et privées; le layout public propose Explorer, Connexion et Inscription.  
**À tester en navigateur :** persistance du panier, reprise exacte de l'intention après connexion, flux paiement Sandbox et états de commande.

### Professionnel boutique
1. Entre dans son espace professionnel et ne voit que les actions pertinentes pour gérer son activité.
2. Ajoute un produit depuis la galerie du téléphone, contrôle les aperçus et les photos avant l'enregistrement.
3. Configure sa vitrine pour sa boutique, ajoute un logo et choisit un modèle adapté.
4. Publie et reçoit un résultat explicite ; en cas d'échec, conserve le contexte et obtient un message exploitable.

**Correction V11 :** `LogoPicker` branché dans Storefront Builder; le logo est visible dans l'aperçu et envoyé dans `configuration.logo`; l'erreur de publication n'est plus avalée silencieusement. Le type de vitrine est verrouillé lorsque le Builder est ouvert depuis un établissement identifié, pour empêcher de publier un modèle d'hôtel sur une boutique ou inversement.

### Professionnel restaurant / hôtel
Le type de vitrine doit correspondre à l'établissement réellement modifié. Les commandes et réservations ne doivent pas se mélanger, et les formulaires média doivent utiliser le sélecteur commun plutôt que demander une URL saisie manuellement.

**À poursuivre :** intégrer `LogoPicker` et `MediaPicker` dans les formulaires de création/édition restaurant et hôtel après vérification des payloads et endpoints exacts; auditer séparément commandes restaurant, réservations et disponibilités hôtel.

### Livreur / agence
Le rôle doit retrouver ses courses, ses preuves et les actions d'agence sans être noyé dans la navigation boutique/restaurant. L'annuaire livreurs/agences et le rattachement à une agence doivent être vérifiés avec des données réelles.

**À poursuivre :** test de bout en bout des statuts, de la preuve de livraison, de la livraison groupée et des droits agence/livreur. Cette livraison ne prétend pas valider ces flux.

## 2. Changements V11

- Ajout du composant `LogoPicker` au Builder de vitrine : sélection galerie/fichiers, aperçu, suppression, limite d'un logo et téléversement via le composant média commun.
- Le logo est chargé depuis la configuration existante quand disponible, injecté dans l'aperçu et conservé dans `configuration.logo` à l'enregistrement.
- Le type boutique/restaurant/hôtel est initialisé à partir de `espaceType` dans l'URL.
- Lorsque le Builder est ouvert depuis un espace réel (`espaceId` et `espaceType`), le changement de métier est désactivé pour éviter les incohérences métier.
- L'échec de publication est affiché à l'utilisateur; l'état de soumission est explicite et le bouton est désactivé pendant l'enregistrement.
- Amélioration responsive du Builder sur petits écrans : actions accessibles, panneau compact, retours visuels et transitions courtes avec respect de `prefers-reduced-motion`.

## 3. Vérifications exécutées

- Transpilation syntaxique TypeScript/TSX : 82 fichiers inspectés, 0 diagnostic syntaxique.
- `node --check` sur les fichiers JavaScript backend : aucune erreur de syntaxe.
- Inspection statique des routes de navigation, du Builder, du stockage de configuration et du flux upload.
- L'intégrité de l'archive doit être vérifiée après création.

## 4. Limites et risques non masqués

- `npm ci --ignore-scripts --no-audit --no-fund` a dépassé le délai dans l'environnement; le build Vite/TypeScript complet n'a donc pas pu être exécuté.
- Aucun test E2E navigateur, aucun test réseau sur le backend Render, aucun test réel de compte Google ni paiement n'a été exécuté.
- Le logo est sauvegardé dans la configuration de vitrine; sa persistance dépend du fait que le backend conserve `configuration` (confirmé statiquement dans le contrôleur). La propagation vers toutes les pages publiques doit être testée.
- `MediaPicker` est intégré au produit et `LogoPicker` au Builder, mais tous les formulaires de création/édition de boutique, restaurant, hôtel et agence ne sont pas encore raccordés au composant commun.
- Le stockage durable des médias doit être validé avec le stockage objet S3 compatible en production; ne pas considérer le disque local Render comme durable.
- Les warnings d'index Mongoose et les vulnérabilités npm mentionnés précédemment nécessitent une tranche de maintenance distincte et ne sont pas corrigés par V11.

## 5. Critères d'acceptation avant de déclarer les fondations terminées

- [ ] Build GitHub Actions vert et assets chargés sous `/Loka/`.
- [ ] Connexion, inscription, confirmation e-mail, reset et Google testés sur navigateur.
- [ ] 401 expiré testé sur plusieurs actions métier; retour vers la page initiale confirmé.
- [ ] Ajout/suppression de photos et logo testé sur téléphone réel; fichiers encore accessibles après redémarrage backend.
- [ ] Publication de vitrine testée sur boutique, restaurant et hôtel, avec erreur réseau et réussite.
- [ ] Parcours visiteur → fiche → panier/réservation → paiement → suivi validé.
- [ ] Parcours professionnel, livreur et agence validés séparément sur mobile et desktop.
- [ ] Animations d'ouverture/fermeture vérifiées et réduction des mouvements respectée.
