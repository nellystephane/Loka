# Loka — Storefront Design Bible V1

## Intention

Les vitrines Loka ne doivent pas être une collection de skins interchangeables.
Chaque template doit avoir une vraie direction artistique, une hiérarchie propre, une logique de contenu et un comportement responsive cohérent.

## Références de recherche

La recherche de référence s'appuie notamment sur des galeries qui classent les sites par industrie, type, typographie, style et sections, notamment Land-book et SiteInspire.

Principes retenus :
- étudier une composition complète plutôt qu'une simple palette ;
- observer les variantes de hero, grille, typographie, navigation, footer et transitions ;
- distinguer minimalisme, éditorial, immersion, e-commerce, hospitality et layouts atypiques ;
- rechercher une identité propre à chaque activité au lieu d'appliquer le même template à tous les métiers.

Les références servent à nourrir la direction artistique. Aucun template Loka ne doit copier une composition ou une identité de marque existante.

## Règles non négociables

1. Mobile first, sans réduire artificiellement la version desktop.
2. Une section doit avoir une fonction commerciale ou narrative claire.
3. Le contenu réel de l'espace professionnel doit piloter le rendu.
4. Une photo pauvre ne doit pas casser la composition : prévoir des fallbacks élégants.
5. Les CTA transactionnels Loka restent reconnaissables et accessibles.
6. L'accent du professionnel personnalise l'identité, mais ne remplace pas les couleurs sémantiques.
7. Les animations doivent renforcer la perception et non ralentir la tâche.
8. Le responsive doit être pensé comme une composition différente, pas comme une simple colonne CSS.
9. Chaque template doit avoir une signature : rythme, densité, typographie, cadrage média, navigation ou structure.
10. Aucun template ne doit être qualifié de premium uniquement parce qu'il utilise plus d'ombres, de blur ou de gradients.

## Architecture artistique

Chaque template est décrit par :

- family : métier / activité ;
- composition : structure de page ;
- density : compact, balanced ou spacious ;
- hero : type de mise en scène média ;
- navigation : inline, floating, sidebar, editorial ou compact ;
- sections : ordre et rôle des blocs ;
- typography : hiérarchie, contraste et largeur de lecture ;
- mediaBehavior : cover, contained, mosaic, split, gallery ;
- motionProfile : restrained, fluid, immersive ;
- mobileStrategy : reflow, stack, rail, bottom-actions ;
- variants : light/dark/editorial lorsque pertinent.

## Direction par activité

### Boutique

Éviter le simple "hero + grille de cartes".
Explorer : éditorial produit, magazine, collection story, asymétrie contrôlée, grands visuels, merchandising visuel, navigation par collection.

### Restaurant

L'expérience doit faire sentir le lieu avant de montrer le menu.
Explorer : photographie immersive, typographie gastronomique, menu éditorial, réservation persistante, histoire du lieu, galerie et informations pratiques.

### Hôtel

Le template doit vendre une expérience de séjour, pas uniquement une liste de chambres.
Explorer : destination hero, galerie immersive, chambres, expériences, services, localisation et réservation.

### Livraison

La priorité est la confiance et la lisibilité opérationnelle.
Explorer : zones couvertes, preuve de disponibilité, types de véhicules, flotte, indicateurs de service, demande de livraison et suivi.

## Niveau de qualité attendu

Un template terminé doit pouvoir être présenté comme une vraie vitrine professionnelle autonome, même avant d'être connecté à un catalogue riche.

Le prochain travail visuel se fera template par template, avec validation de :
- desktop large ;
- desktop standard ;
- tablette ;
- mobile ;
- contenu court ;
- contenu riche ;
- une photo ;
- plusieurs photos ;
- aucun média ;
- texte long ;
- état vide ;
- CTA de contact ;
- CTA transactionnel ;
- mode sombre lorsque prévu.

## V24 — Système de contenu adaptatif pour les boutiques

Les templates ne doivent jamais imposer au professionnel une liste fixe de blocs à remplir. La donnée source devient indépendante de la composition visuelle.

### Principe

`Boutique → Catalogue → Produit → Variantes/Attributs → Catégories/Collections → Profil de richesse → Template → Sections compatibles → Vitrine`

Le professionnel renseigne d'abord les informations essentielles du produit. Les champs complémentaires sont conditionnels au type de produit et toujours facultatifs lorsque l'information n'est pas nécessaire à la vente.

### Produit normalisé

Un produit conserve les champs historiques (`nom`, `description`, `categorie`, `prix`, `photos`, `variantes`, stock, état, marque, modèle) et ajoute :

- `categorieId` : catégorie structurée de la boutique, sans casser l'ancien champ texte `categorie` ;
- `attributs` : informations libres dépendantes du type de produit (matière, ingrédients, garantie, origine, dimensions, etc.) ;
- `tags` : recherche et organisation ;
- `collections` : rattachement à une ou plusieurs collections.

### Catégories

`CategorieBoutique` permet de créer des catégories propres à la boutique. Une catégorie peut être manuelle ou issue d'une suggestion. Le vendeur peut réutiliser une catégorie existante au lieu de la recréer pour chaque produit.

### Collections

`CollectionBoutique` peut être manuelle ou automatique. Une collection peut regrouper des produits sans modifier leur catégorie. Les collections sont facultatives et peuvent être créées après l'ajout des produits.

### Sections automatiques

Les sections suivantes ne doivent pas devenir des champs obligatoires :

- nouvelles arrivées : calculées à partir de la date de création/publication ;
- produits populaires : calculés à partir des interactions disponibles ;
- catégories : dérivées des catégories structurées ;
- collections : dérivées des collections existantes ;
- galerie : disponible si les médias sont suffisamment riches ;
- histoire : affichée si le contenu de présentation existe.

### Formulaire adaptatif

Le parcours `/pro/catalogue` suit quatre niveaux :

1. Essentiel : photo, nom, prix, description, type et stock ;
2. Variantes : taille, couleur, format, capacité, etc., uniquement si le produit en possède ;
3. Caractéristiques : attributs suggérés selon le type de produit, sans obligation ;
4. Organisation : catégorie et collection, avec possibilité de laisser Loka organiser plus tard.

### Conséquence pour les templates

Un template doit consommer un profil de contenu et choisir les sections qu'il peut réellement alimenter. Une section sans contenu ne doit pas produire un espace vide ni demander au vendeur de recréer ses données.

Un changement de template ne modifie donc jamais le catalogue. Le même contenu peut être présenté comme grille, index éditorial, composition immersive, mosaïque ou toute autre direction artistique.

### Interaction produit

Chaque template doit permettre l'ouverture d'une fiche produit contextualisée. La fiche réutilise le langage visuel du template (couleurs, profondeur, typographie, médias et rythme) et peut afficher variantes, couleurs, tailles, caractéristiques, ingrédients et autres attributs lorsqu'ils existent.
