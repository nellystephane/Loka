# Changelog V12

- Corrige les navigations internes pour le déploiement GitHub Pages sous `/Loka/`.
- Copie le point d'entrée vers `404.html` après le build pour préserver les liens profonds GitHub Pages.
- Expose le SHA du déploiement Render sur `/api/version`.
- Déclare explicitement les types React nécessaires au build TypeScript de production.
- Rend le flux checkout plus robuste face aux bloqueurs de fenêtres et aux délais de confirmation.
- Ne présente plus un choix de moyen de paiement comme effectif si le backend ne le reçoit pas.
- Bloque explicitement le paiement avec livraison tant qu'aucun tarif réel n'est calculé.
- Refuse les SVG sur la route d'upload image et n'accepte que des formats raster prévus.
- Ajoute un rapport d'audit et une liste transparente des vérifications encore requises.
