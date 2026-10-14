# Prompt — Loka V18 / Boutique Editorial — HTML preview

Crée un prototype web COMPLET dans un seul fichier `index.html`, sans framework, sans build, sans npm et sans fichiers externes de code.

Le prototype doit reproduire fidèlement la direction artistique du template Loka V18 « Boutique Editorial / Maison Naya ».

## Objectif

Je veux pouvoir ouvrir directement `index.html` depuis un téléphone Android avec un éditeur comme Acode et visualiser le rendu. Le résultat doit donc fonctionner simplement en ouvrant le fichier dans un navigateur.

## Direction artistique

Créer une vitrine de boutique haut de gamme, éditoriale, contemporaine et originale.

Le résultat ne doit surtout pas ressembler à un template e-commerce générique.

Références de principe :
- webdesign éditorial contemporain ;
- luxury / quiet luxury ;
- magazines de mode ;
- vitrines lifestyle ;
- compositions asymétriques ;
- photographie dominante ;
- typographie serif expressive associée à une sans-serif discrète ;
- beaucoup d'espace négatif ;
- rythme visuel lent mais jamais lourd ;
- détails subtils et interactions tactiles.

Ne copie aucune création existante. Inspire-toi uniquement des principes de composition, hiérarchie, typographie, photographie et interaction.

## Palette

Fond principal : `#F4F1EB`
Fond secondaire : `#EBE6DC`
Fond sombre : `#171614`
Texte principal : `#171614`
Texte secondaire : `#77726A`
Ligne : `rgba(23,22,20,.13)`
Accent : `#7C6A55`

L'accent doit rester discret et élégant. Il ne doit jamais devenir une couleur dominante criarde.

## Contenu de démonstration

Nom : Maison Naya
Activité : Mode & accessoires
Localisation : Cotonou, Haie Vive
Note : 4.8 / 5
Avis : 126

Description :
« Une sélection locale pensée pour le quotidien, avec possibilité de commander et de contacter directement la boutique. »

Utilise deux belles images Unsplash comme contenu de démonstration :
- une image d'intérieur de boutique / lifestyle ;
- une image de collection mode/accessoires.

Les images doivent être traitées avec `object-fit: cover`, légèrement désaturées et intégrées à la direction artistique.

## Structure exacte

### 1. Header

Header très fin, élégant.

Desktop :
- logo circulaire « MN » à gauche ;
- Maison Naya ;
- navigation centrée : Collection / Maison / Journal ;
- actions à droite : Partager / menu.

Mobile :
- logo + nom à gauche ;
- actions à droite ;
- navigation desktop masquée.

Header avec une ligne très subtile en bas.

### 2. Hero

Desktop : deux colonnes asymétriques.

Colonne gauche :
- petit kicker : `COTONOU · HAIE VIVE · 4.8 ★` ;
- énorme titre serif :
  `Objets choisis.`
  `Présence locale.`
- « Présence locale. » en italique / accent ;
- description ;
- bouton noir arrondi : `Découvrir la collection` + flèche ;
- lien secondaire `Enregistrer`.

Colonne droite :
- grande photographie verticale occupant toute la hauteur du hero ;
- petit indicateur `01 / 02` ;
- `Maison Naya` en bas.

Le hero doit donner une impression de couverture éditoriale premium.

### 3. Marquee

Une ligne horizontale très fine contenant :
`LOCAL OBJECTS · CURATED DAILY · MADE TO BE LIVED · COTONOU`

Avec petits symboles entre les textes.

Pas d'animation agressive.

### 4. Introduction

Grande section avec beaucoup d'espace.

À gauche : `01`

Titre :
`Une boutique qui se lit comme une maison.`

« maison » en accent.

À droite : texte descriptif expliquant que la vitrine est une extension de l'identité de la boutique.

La grille doit être asymétrique.

### 5. Collection

Fond légèrement différent.

En-tête :
`02 · SÉLECTION`
`La collection actuelle`

Lien à droite : `Voir tout →`

Deux produits / compositions photographiques.

La première image doit être plus grande.
La deuxième doit être légèrement décalée verticalement sur desktop.

Chaque image possède :
- petit label « Édition 01 » / « Édition 02 » ;
- nom ;
- sous-titre ;
- flèche.

Sur mobile, supprimer le décalage et empiler proprement les éléments.

### 6. Story / Journal

Deux colonnes.

Grande image à gauche.

Texte à droite :
`03 · LE JOURNAL`

Titre :
`Le beau n'a pas besoin de faire du bruit.`

Paragraphe éditorial.

Lien :
`Découvrir la maison →`

### 7. Contact / localisation

Fond sombre `#171614`.

Titre très grand :
`Haie Vive,`
`Cotonou.`

Le second mot doit avoir l'accent.

À droite :
- icône localisation ;
- Cotonou, Haie Vive ;
- `Ouvert aujourd'hui · 08:00 — 20:00` ;
- bouton clair `Voir l'itinéraire →`.

### 8. Footer

Très minimal.

Maison Naya / Une vitrine Loka / © 2026.

## Responsive mobile

Le mobile est prioritaire.

À 900px environ :
- hero devient une colonne ;
- image sous le contenu ;
- navigation centrale masquée ;
- collections passent en une colonne ;
- story devient verticale ;
- contact devient une colonne.

À 560px :
- marges latérales autour de 20px ;
- titre hero environ 46–70px selon largeur ;
- titre des sections environ 42px ;
- boutons confortables au toucher ;
- aucun texte minuscule illisible ;
- aucune largeur fixe provoquant un scroll horizontal.

## Interactions

Ajouter de petites interactions uniquement lorsque pertinentes :

- images avec léger zoom au survol desktop ;
- boutons qui montent de 1–2px au survol ;
- apparition douce des sections lors du scroll ;
- liens avec soulignement animé ;
- navigation fluide vers les ancres ;
- menu mobile fonctionnel ;
- bouton partager avec une petite interface simple ;
- bouton enregistrer qui change d'état.

Sur mobile, les interactions hover doivent être désactivées ou remplacées par des interactions tactiles normales.

Respecter `prefers-reduced-motion: reduce`.

## Qualité technique

Tout doit être dans `index.html` :
- HTML ;
- CSS ;
- JavaScript.

Aucune dépendance obligatoire.

Tu peux utiliser des SVG inline pour les icônes.

Pas de Tailwind.
Pas de Bootstrap.
Pas de React.
Pas de framework.
Pas de build.

Le fichier doit être directement ouvrable sur Android.

Utiliser des balises sémantiques : `header`, `nav`, `main`, `section`, `article`, `footer`.

Ajouter les métadonnées de base : title, description, viewport.

Les images doivent avoir des `alt` pertinents.

Éviter les animations lourdes, WebGL et bibliothèques externes.

## Règle esthétique essentielle

Ne cherche pas à remplir l'écran.

Le luxe visuel vient ici de :
- l'espace ;
- la typographie ;
- les proportions ;
- la qualité des images ;
- la grille ;
- les contrastes ;
- les détails.

Le résultat doit être suffisamment raffiné pour pouvoir servir de référence visuelle aux futurs templates Loka.

Je veux un résultat qui ressemble à une vraie vitrine conçue par une équipe de design produit expérimentée, pas à une démo HTML générée automatiquement.

Retourne uniquement le contenu complet de `index.html` dans un seul bloc de code.
