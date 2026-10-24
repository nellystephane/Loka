# Prompt HTML — Loka V21 « Float Form »

Crée un prototype web COMPLET dans un seul fichier `index.html`, sans framework, sans build, sans npm et sans fichiers externes de code.

Le prototype doit reproduire la direction artistique du template Loka V21 « Boutique Float Form ».

## Idée centrale

La boutique doit présenter les produits comme des objets physiques mis en scène dans l'espace numérique.

Ne fais PAS une grille e-commerce classique.

Les produits doivent sembler :
- flotter légèrement au-dessus de leur support ;
- sortir de leur carte ;
- avoir une profondeur visuelle ;
- posséder une ombre douce et réaliste ;
- être légèrement inclinés ;
- avoir des éléments secondaires qui flottent autour d'eux ;
- rester élégants et fluides, jamais gadget.

L'inspiration générale vient des tendances contemporaines de product cards 3D, de commerce éditorial, de motion design et de compositions « floating product ». Les références peuvent inclure des galeries comme Dribbble et Behance, mais ne copie aucune création existante.

## Direction artistique

Nom : Maison Naya
Activité : Mode & accessoires
Lieu : Cotonou · Haie Vive

Créer une esthétique contemporaine, artistique et premium.

Le design doit être très différent des templates V18, V19 et V20.

Cette fois :
- fond lavande/gris très pâle ;
- violet profond ;
- accent violet électrique configurable ;
- petites touches rose/corail très discrètes ;
- surfaces blanches translucides ;
- profondeur 3D simulée en CSS ;
- grandes typographies ;
- cartes produits sculpturales ;
- asymétrie ;
- beaucoup d'espace ;
- aucune grille monotone.

Palette de départ :

--background: #F1EFF9
--surface: #FFFFFF
--ink: #17142A
--muted: #77738A
--accent: #6D5DF6
--soft-blue: #D9ECFF
--soft-violet: #DCD6F7
--dark: #18152A

## HERO

Header fin :
- logo MN ;
- Maison Naya ;
- Collection ; Maison ; Contact ;
- partage ; panier.

Hero en deux zones desktop.

À gauche :

MAISON NAYA · COTONOU

« Objects
with lift. »

Le mot « lift » en serif italique et accent violet.

Description courte.

Bouton noir arrondi :
Voir les pièces →

Petit indicateur :
✦ Curated locally

À droite :
Créer une scène 3D simulée en CSS.

Un grand objet/carte produit doit être incliné.

Derrière :
- une deuxième carte légèrement décalée ;
- une forme circulaire lumineuse ;
- un halo ;
- une petite carte flottante ;
- une étiquette « 4.8 / 126 avis ».

Le produit principal doit visuellement sortir du cadre de sa carte.

Utiliser `transform`, `perspective`, `translateZ`, `rotate`, `box-shadow` et éventuellement `transform-style: preserve-3d`.

Ne pas utiliser WebGL.

## TICKER

Une ligne très fine :

FORM · MATIÈRE · SILHOUETTE · FORM · MATIÈRE · SILHOUETTE

## SECTION PRODUITS

Titre très grand :

Made to
stand out.

Les trois produits ne doivent PAS avoir la même hauteur ni la même position.

Produit 1 : grand.
Produit 2 : légèrement décalé vers le bas.
Produit 3 : plus petit et plus graphique.

Chaque carte doit posséder :
- fond différent ;
- numéro ;
- image ;
- bouton circulaire ;
- titre ;
- sous-titre ;
- action.

### Effet essentiel

Les images doivent dépasser légèrement du support visuel.

Elles doivent sembler suspendues à environ quelques dizaines de pixels au-dessus de leur carte.

Au survol desktop :
- translation verticale légère ;
- rotation qui se redresse légèrement ;
- ombre qui augmente ;
- transition douce 400–500ms.

Aucune animation agressive.

Sur mobile, remplacer le hover par un état tactile naturel et conserver la profondeur sans exiger de mouvement complexe.

## SECTION STORY

Fond violet/noir très sombre.

Grande photographie à gauche.

À droite :

02 / THE HOUSE

« Give the
object room. »

Texte éditorial.

Trois statistiques :
4.8 / note
126 / avis
08—20 / ouvert

Bouton contour :
Découvrir la maison →

Ajouter un cercle graphique discret par-dessus la photographie.

## CONTACT

Grand bloc violet accent.

Titre :

Come
closer.

Carte localisation :
Haie Vive, Cotonou
Ouvert aujourd'hui · 08:00—20:00
Itinéraire →

## FOOTER

Très minimal.

Maison Naya
Une vitrine Loka
© 2026

## RESPONSIVE

Mobile-first.

Desktop : composition 3D complète.

Tablet : réduire les dimensions mais conserver la profondeur.

Mobile :
- hero en colonne ;
- objet principal centré ;
- carte arrière visible ;
- petites cartes flottantes repositionnées ;
- produits en colonne ;
- aucun débordement horizontal ;
- boutons tactiles confortables ;
- navigation principale masquée ;
- mini navigation flottante en bas.

Le produit doit rester le héros même sur petit écran.

## QUALITÉ VISUELLE

Ne surcharge pas.

Le 3D doit être subtil et crédible.

Éviter :
- ombres noires trop fortes ;
- rotations excessives ;
- gradients partout ;
- glassmorphism sur tous les éléments ;
- cartes identiques ;
- animations constantes ;
- look « gaming ».

Le résultat doit évoquer une direction artistique de produit premium, avec une vraie maîtrise de la composition.

## TECHNIQUE

Un seul `index.html`.

CSS et JavaScript inclus dans le fichier.

Aucun framework.

Aucune dépendance obligatoire.

SVG inline autorisés.

Ajouter :
- viewport ;
- title ;
- meta description ;
- alt sur les images ;
- HTML sémantique.

Respecter `prefers-reduced-motion: reduce`.

Utiliser des images Unsplash si nécessaire, mais le fichier doit rester facilement testable sur Android.

Retourne uniquement le contenu complet de `index.html` dans un seul bloc de code.
