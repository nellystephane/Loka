# Changelog V13

- Fix viewport mobile manquant dans `client/index.html`.
- Refonte responsive de l'accueil public avec spacing horizontal, typographie fluide, recherche mobile-first, rails horizontaux et états vides actionnables.
- Fix du bouton de recherche masqué par le helper `location()`.
- Destination post-login contextualisée : `returnTo` prioritaire, profil utilisateur par défaut, espace pro pour rôle admin.
- Création de la page de profil connectée, raccordée à `GET /api/users/profil`, avec liens d'activités valides et déconnexion.
- Contrôle du thème clair/sombre dans l'en-tête public.
- Rapport d'audit : `LOKA_AUDIT_MOBILE_AUTH_V13.md`.
