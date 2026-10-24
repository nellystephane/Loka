# Loka V22 — Pop Object / Art-Directed Commerce

Crée un prototype web complet dans UN SEUL fichier `index.html`, directement ouvrable sur Android avec Acode, sans framework, sans npm et sans build.

## Direction artistique

Le design doit s'inspirer des principes visuels des références fournies :
- produit dominant dans la composition ;
- grandes surfaces colorées derrière le produit ;
- produits qui débordent volontairement de leur carte ou de leur bloc ;
- cartes blanches superposées ;
- petits boutons circulaires flottants ;
- typographie très grande ;
- composition asymétrique ;
- sensation d'affiche/campagne interactive ;
- interface simple malgré une direction artistique riche.

NE COPIE PAS les références, leurs marques, leurs textes ou leur composition exacte. Crée une interprétation originale pour Loka.

## Concept

Nom : NOVA OBJECTS
Activité : boutique mode / accessoires / lifestyle
Localisation : Cotonou · Haie Vive
Signature : OBJECTS WITH ATTITUDE.

Le produit est le héros. La carte est seulement sa scène.

Le résultat doit ressembler davantage à une campagne digitale de marque qu'à une grille e-commerce classique.

## Palette

Utiliser une palette radicalement différente des templates précédents :

- environnement extérieur : `#D7FF4F` vert acide
- surface principale : `#F7F7F2`
- noir : `#111111`
- orange/coral : `#FF5C35`
- violet : `#6C4DFF`
- accent secondaire : `#9EEAFF`

L'utilisateur Loka pourra personnaliser l'accent plus tard, mais le template doit avoir une identité forte par défaut.

Ne pas utiliser une palette beige/vintage.

## Structure

### 1. Environnement

Toute la page possède un fond vert acide.

Au centre, une grande interface claire avec :
- largeur maximale ~1380px ;
- coins ~30px ;
- ombre douce ;
- fine bordure.

Sur mobile, l'interface prend presque toute la largeur.

### 2. Header

Navigation légère :

- bouton menu
- logo NOVA OBJECTS
- Shop
- Search
- Category
- Collection
- recherche
- panier avec badge
- profil

Sur mobile, réduire la navigation et conserver seulement les actions essentielles.

### 3. Hero

Créer une composition asymétrique.

À gauche :

`MAISON NAYA · COTONOU · 01`

Titre géant :

`MOVE`
`DIFFERENT.`

Le second mot peut utiliser le violet comme accent.

Texte court :

« Une sélection locale pensée comme une collection d'objets : expressive, portable et impossible à confondre. »

CTA sombre :

`Découvrir →`

Puis une note :

`★ 4.8 · 126 avis`

### 4. Produit principal

À droite, construire une scène composée de plusieurs couches :

- forme orange/coral derrière ;
- forme violette secondaire ;
- carte blanche ;
- grande photo de produit ;
- panneau d'informations translucide ;
- bouton circulaire `+` qui déborde de la carte ;
- petit sticker circulaire noir ;
- indicateurs 01 / 02 / 03 / 04.

Le produit doit être grand et légèrement sortir de son cadre.

Utiliser subtilement :
- `transform`
- `rotate`
- `scale`
- `drop-shadow`
- perspective légère si nécessaire.

Pas de faux effet 3D lourd.

### 5. Marquee

Une bande horizontale minimaliste :

`NEW OBJECTS · LOCAL CURATION · DESIGNED TO BE SEEN`

### 6. Collection

Titre :

`Pick your form.`

Créer trois produits.

Ils doivent avoir des scènes différentes :

Produit 01 : orange/coral
Produit 02 : violet
Produit 03 : noir

Les produits doivent dépasser légèrement des surfaces colorées.

Ne pas faire trois cartes identiques.

Le premier est plus grand.
Le second est légèrement décalé verticalement.
Le troisième plus compact.

Chaque produit :
- index
- image
- nom
- description courte
- prix
- bouton circulaire `+`.

### 7. Grande section campagne

Fond noir.

Titre géant :

`NOT`
`ANOTHER`
`PRODUCT.`

Le mot PRODUCT utilise l'accent vert acide.

À droite : grande photographie qui déborde visuellement de la section.

Ajouter une forme circulaire colorée derrière l'image.

### 8. Story

Section claire avec :

`OBJECTS WITH ATTITUDE.`

Texte sur la boutique.

Afficher :
- note
- avis
- horaires

CTA : contacter la boutique.

### 9. Footer

Très minimal.

NOVA OBJECTS
Une vitrine Loka
Cotonou · Haie Vive
© 2026

## Responsive

Le mobile est une vraie composition, pas un desktop écrasé.

À moins de 600px :
- interface presque pleine largeur ;
- hero vertical ;
- produit principal toujours très grand ;
- formes colorées visibles ;
- produits secondaires en colonne ;
- catégories en scroll horizontal si nécessaire ;
- barre de navigation basse flottante ;
- aucun scroll horizontal accidentel ;
- boutons tactiles d'au moins ~44px.

## Motion

Ajouter uniquement des animations utiles :

- produit qui monte légèrement au hover ;
- légère rotation ;
- cartes qui gagnent un peu de profondeur ;
- boutons flottants avec micro-interaction ;
- apparition douce des sections ;
- transitions de navigation.

Sur mobile, ne pas dépendre du hover.

Respecter :

`prefers-reduced-motion: reduce`

## Images

Utiliser des images de produits/lifestyle libres, sans logos de marques tierces.

Les produits doivent être visuellement dominants.

## Qualité

Le résultat doit être :

- original
- audacieux
- élégant
- commercial
- très responsive
- artistique
- lisible
- fluide

Il ne doit pas être :

- une copie Pinterest ;
- une simple grille de produits ;
- un template générique ;
- une explosion de couleurs sans hiérarchie ;
- un faux design 3D lourd.

## Technique

Tout dans `index.html` :

- HTML
- CSS
- JavaScript
- SVG inline pour les icônes

Pas de React.
Pas de Tailwind.
Pas de Bootstrap.
Pas de framework.
Pas de build.

Ajouter les métadonnées viewport et title.

Retourner uniquement le contenu complet de `index.html` dans un seul bloc de code.
