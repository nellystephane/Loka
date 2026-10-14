# Prompt — Loka V19 / Boutique Neo Flux

Crée un prototype web COMPLET dans un seul fichier `index.html`, sans framework, sans build, sans npm et sans dépendance obligatoire. Le fichier doit pouvoir être ouvert directement depuis un téléphone Android avec Acode.

## Concept

Reproduire la direction artistique du template Loka V19 « Boutique Neo Flux ».

Ce template est volontairement l'opposé de V18 : V18 était vintage/editorial/quiet luxury ; V19 doit être contemporain, graphique, audacieux, presque fashion-art-direction, mais rester utilisable comme vraie vitrine commerciale.

Il ne doit pas ressembler à un dashboard, un template SaaS ou un simple e-commerce.

Il doit donner l'impression d'une petite marque contemporaine qui possède une direction artistique forte.

## Inspiration

S'inspirer des principes observables dans les galeries de webdesign et les recherches Pinterest autour des boutiques mode, du luxe contemporain, des layouts éditoriaux et des vitrines très graphiques : typographie géante, compositions asymétriques, images pleine hauteur, espaces négatifs, collages, éléments flottants, contrastes forts et détails inattendus.

Ne copie aucune création existante.

## Identité

Nom : Maison Naya
Activité : Mode & accessoires
Localisation : Cotonou, Haie Vive

Palette :
- fond clair : #F3F2EC
- noir : #11110F
- gris : #777770
- accent acide : #B8FF2C

L'accent doit être configurable dans l'esprit du template. Il doit être utilisé comme une signature graphique, pas comme une couleur répandue partout.

## Typographie

Utiliser une sans-serif très nette et lourde pour les titres.

Les grands titres doivent être très grands, serrés et presque poster-like.

L'italique n'est pas nécessaire : utiliser plutôt le contraste de couleur, de poids et de taille.

## Header

Header très propre :
- logo circulaire MN
- Maison Naya
- navigation : Drop 01 / Studio / Selection / Visit
- partage
- favori
- menu

Sur mobile, cacher la navigation centrale et conserver une barre compacte.

## HERO

Créer une composition très forte à deux colonnes sur desktop.

À gauche :
DROP 01 / 2026

Titre énorme :
MAKE
SPACE.

SPACE doit utiliser l'accent #B8FF2C avec un fin contour sombre.

Description courte.

Bouton :
EXPLORE THE DROP →

À droite : une image verticale très grande.

Ajouter un petit cercle graphique flottant à la jonction entre les deux zones.

Ajouter un petit texte vertical sur le bord droit :
LOCAL / GLOBAL
06.20.26

Le hero doit être spectaculaire sans être chaotique.

## BANDEAU

Ajouter une bande horizontale très fine :
NOT A SHOP · A POINT OF VIEW · COTONOU · LOKA

Avec petits symboles graphiques.

## SECTION STUDIO

Composition asymétrique.

Petit numéro 02.

Titre géant :
Ordinary pieces.
Unordinary presence.

La deuxième ligne doit utiliser l'accent.

Ajouter un court texte éditorial et un lien :
Meet the house →

## SECTION PRODUITS

Fond légèrement différent.

Titre :
03 / THE DROP
Current signal

Afficher trois produits.

Ils ne doivent PAS avoir trois cartes identiques.

Le produit central doit être plus grand et légèrement décalé verticalement sur desktop.

Chaque produit possède :
- image
- numéro
- nom
- sous-titre
- bouton circulaire avec flèche

Sur mobile :
- une seule colonne
- garder une hiérarchie claire
- aucun scroll horizontal obligatoire

## COLLAGE

Créer une section sombre très artistique en trois zones :

1. grande image
2. texte :
THE MOOD
Less expected.
+ paragraphe
3. petite image verticale avec label OBJECT / 001

Cette section doit être l'un des moments les plus visuels du prototype.

## CONTACT

Utiliser l'accent #B8FF2C comme fond.

Titre :
Come
through.

Informations :
LOCATION
Cotonou, Haie Vive

HOURS
08:00 — 20:00

Bouton :
OPEN DIRECTIONS →

## FOOTER

Très minimal :
MN / Maison Naya
Une vitrine Loka
© 2026 / Cotonou

## RESPONSIVE

Mobile-first.

À moins de 900px :
- hero en colonne
- image sous le texte
- navigation centrale cachée
- studio en colonne
- produits en deux colonnes avec le produit principal sur toute la largeur
- collage adapté
- contact en colonne

À moins de 560px :
- produits en une colonne
- grandes marges réduites à environ 20px
- titres encore très grands mais sans overflow
- aucun élément ne doit sortir de l'écran
- boutons suffisamment grands pour le tactile
- aucun scroll horizontal involontaire

## INTERACTIONS

Ajouter :
- hover léger sur les CTA
- micro-déplacement des boutons
- zoom très léger sur les images au survol desktop
- apparition douce des sections au scroll
- navigation fluide

Sur mobile, ne pas dépendre du hover.

Respecter `prefers-reduced-motion: reduce`.

## TECHNIQUE

Tout dans `index.html` : HTML + CSS + JavaScript.

Pas de React.
Pas de Tailwind.
Pas de Bootstrap.
Pas de build.

Utiliser des SVG inline pour les icônes si nécessaire.

Ajouter `viewport`, `title`, `description` et des `alt` pertinents.

## RÈGLE DE QUALITÉ

Ne transforme pas ce design en simple « page e-commerce colorée ».

La composition est la fonctionnalité principale.

Le résultat doit être audacieux, original, très responsive, mais toujours lisible et commercialement crédible.

Je veux voir une vraie direction artistique, pas une collection de composants.

Retourne uniquement le contenu complet de `index.html` dans un seul bloc de code.
