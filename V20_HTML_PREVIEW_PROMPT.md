# Loka V20 — HTML Preview Prompt

Crée un prototype web COMPLET dans un seul fichier `index.html`, sans framework, sans npm, sans build et sans dépendance obligatoire.

Le fichier doit pouvoir être ouvert directement sur un téléphone Android avec Acode et dans un navigateur mobile.

## Concept

Créer une vitrine de boutique contemporaine appelée **Maison Naya**, inspirée par une direction artistique de type **spatial commerce / app-like luxury / glass interface**.

La référence visuelle fournie au designer montre une interface automobile très épurée avec :
- deux niveaux de lecture entre grand écran et mobile ;
- objet principal extrêmement présent ;
- grands espaces blancs/gris ;
- cartes translucides ;
- barre de recherche flottante ;
- navigation flottante ;
- boutons circulaires ;
- informations courtes superposées au média ;
- une esthétique presque « objet numérique » plutôt que « site web classique ».

Ne copie aucune marque, aucun logo, aucune composition exacte et aucune image de la référence. Utilise uniquement les principes de direction artistique.

## Objectif esthétique

Le résultat doit immédiatement sembler différent d'une boutique e-commerce classique.

Je veux l'impression suivante :

> une boutique physique contemporaine transformée en objet numérique interactif.

Le site doit être premium, tactile, spatial et très propre sans tomber dans le simple glassmorphism décoratif.

Le verre doit servir à créer des couches d'information, pas à décorer chaque élément.

## Palette

Fond principal : `#E9EDF0`
Fond clair secondaire : `#F4F6F7`
Fond sombre : `#101214`
Texte : `#111315`
Texte secondaire : `#70777B`
Accent : `#C7FF3D`
Lignes : `rgba(20,23,25,.12)`

L'accent vert doit être utilisé comme signature visuelle, avec parcimonie.

## Typographie

Utiliser une sans-serif moderne et très nette pour l'interface.

Les grands titres peuvent utiliser une serif très légère en italique pour créer une tension éditoriale.

Les grands titres doivent être très grands sur desktop et fortement redimensionnés sur mobile.

## Contenu

Nom : Maison Naya
Activité : Mode & accessoires
Lieu : Cotonou, Haie Vive
Note : 4.8
Avis : 126

Description :
« Une sélection locale pensée pour le quotidien, avec possibilité de commander et de contacter directement la boutique. »

Utiliser des images Unsplash pertinentes de mode, boutique ou lifestyle.

## STRUCTURE

### 1. Header

Desktop :
- petit logo circulaire MN/N à gauche ;
- Maison Naya ;
- navigation Collection / Découvrir / Maison au centre ;
- deux boutons circulaires à droite.

Mobile :
- logo + nom ;
- actions circulaires ;
- navigation centrale masquée.

Header très fin.

### 2. Hero

Créer un hero spectaculaire mais fonctionnel.

Desktop :
- grande colonne texte à gauche ;
- immense média à droite ;
- composition asymétrique ;
- image verticale avec coins généreusement arrondis ;
- halo d'accent derrière l'image ;
- petit panneau glass flottant sur l'image ;
- disque circulaire décoratif avec texte rotatif/statique ;
- petite indication verticale sur le côté.

Texte :

COTONOU · HAIE VIVE · 04—26

Wear
THE UNEXPECTED.

Ajouter une courte description.

CTA : Explorer →

Lien secondaire : Notre sélection

### 3. Floating Search

Créer une barre de recherche flottante qui chevauche visuellement le bas du hero.

Elle doit avoir :
- icône recherche ;
- texte « Rechercher une pièce, une collection... » ;
- bouton circulaire de filtre ;
- backdrop blur ;
- ombre très douce ;
- forme pill.

À côté sur desktop : petits indicateurs 01 / CATALOGUE / 03.

### 4. Featured collection

Fond clair légèrement différent.

Titre très grand :

Selected
PIECES.

Trois produits avec une grille asymétrique :
- premier grand ;
- deuxième légèrement décalé ;
- troisième plus petit.

Chaque carte :
- grande image ;
- petit numéro circulaire ;
- favori circulaire ;
- titre ;
- sous-titre ;
- action Voir.

La troisième carte peut devenir une carte conceptuelle « MORE SOON » plutôt qu'un faux produit.

### 5. Story / The House

Fond sombre.

Deux grandes colonnes :
- grande photographie à gauche ;
- texte à droite.

Titre :

Not a store.
A point of view.

Texte éditorial court.

Ajouter trois statistiques :
4.8 / rating
126 / avis
08—20 / aujourd'hui

CTA clair mais discret.

### 6. Localisation

Fond accent vert.

Titre gigantesque :

Come
CLOSER.

Carte de localisation translucide avec :
- icône ;
- Haie Vive, Cotonou ;
- horaires ;
- bouton Itinéraire.

### 7. Footer

Très sombre et minimal.

Logo + Maison Naya.

Une vitrine Loka.

© 2026.

## Navigation mobile

Sur mobile, ajouter une bottom navigation flottante en verre :

Explorer
Favoris
Contacter
Profil

Elle doit être confortable au toucher, environ 64px de haut, avec coins très arrondis.

## Responsive

Le mobile est une vraie adaptation, pas simplement la version desktop écrasée.

À environ 900px :
- hero en une colonne ;
- image sous le texte ;
- collection en deux colonnes ;
- story en une colonne ;
- localisation en une colonne.

À environ 560px :
- marges 16–20px ;
- hero très vertical ;
- titres environ 20vw maximum avec limites raisonnables ;
- collection en une colonne ;
- image principale avec hauteur importante ;
- bottom navigation visible ;
- aucun scroll horizontal.

## MOTION

Ajouter uniquement :
- léger déplacement/scale des images au hover desktop ;
- apparition douce des sections au scroll ;
- bouton qui se soulève de 1–2px ;
- transition discrète de la barre flottante ;
- scroll doux vers les sections.

Respecter :
`prefers-reduced-motion: reduce`

Ne pas utiliser de WebGL ou d'animation lourde.

## ACCESSIBILITÉ

- boutons d'au moins 44px ;
- contraste lisible ;
- alt sur les images ;
- focus visible ;
- HTML sémantique ;
- `aria-label` sur les boutons iconographiques.

## CONTRAINTE TECHNIQUE

Tout doit être dans `index.html` :
- HTML
- CSS
- JavaScript

Pas de React.
Pas de Tailwind.
Pas de Bootstrap.
Pas de npm.
Pas de build.

## RÈGLE DE DESIGN

Ne transforme pas le concept en simple « site avec glassmorphism ».

La vraie identité vient de :
- la proportion de l'image ;
- la position des éléments ;
- l'espace ;
- la profondeur ;
- la barre de recherche flottante ;
- les éléments circulaires ;
- les changements de fond ;
- la navigation mobile ;
- la hiérarchie typographique.

Le résultat doit paraître conçu comme un produit numérique premium, pas comme un template e-commerce ordinaire.

Retourne uniquement le contenu complet de `index.html` dans un seul bloc de code.
