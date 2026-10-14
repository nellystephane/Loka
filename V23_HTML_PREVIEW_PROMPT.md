# Loka V23 — HTML Preview Prompt

Create a single standalone `index.html` that previews a completely original Loka boutique storefront concept called **SPECTRUM INDEX**.

The prototype must run directly on a phone in Acode by opening the HTML file. Do NOT use React, Vite, Tailwind, Bootstrap, external UI libraries, npm packages, or build tools. Use only HTML, CSS, vanilla JavaScript and inline SVG when needed.

## Creative direction

This must feel like a new art-directed commerce system, not another ecommerce grid and not a recolor of a previous template.

The central idea is:

> **The catalogue behaves like a visual index.**

Products are numbered entries in an editorial series. The storefront feels closer to a fashion campaign / printed art catalogue / contemporary design archive than to a conventional online shop.

The composition must be intentionally different from the previous Pop Object concept:
- no large rounded ecommerce cards everywhere;
- no repeated three-card product grid;
- no glassmorphism as the main visual language;
- no generic hero + cards layout;
- product discovery happens through a vertical numbered index;
- the product image can break out of its normal rectangular boundaries;
- typography and large color fields create the architecture;
- product detail is opened as a full contextual product sheet.

Do not copy any existing brand, website, Pinterest design, campaign or reference image. Use the principles above to create an original composition.

## Palette

Use a clearly different palette from previous templates:
- deep ultramarine: `#111A3A`
- electric cyan: `#00E5FF`
- vivid tangerine: `#FF5A36`
- warm butter: `#FFE8A3`
- warm paper: `#F3EAD8`
- optional soft pink: `#FFB6D9`

The colors must appear as structural fields, not just tiny accents.

## Storefront identity

Demo business:
- Maison Naya
- Cotonou · Haie Vive
- Mode & accessoires
- rating 4.8
- 126 avis

Navigation:
- INDEX
- HOUSE
- VISIT
- search icon
- cart icon
- favorites icon

## Page structure

### 1. Header

A compact editorial navigation bar.

Left:
- small menu icon
- MN mark
- MAISON NAYA

Center:
- INDEX
- HOUSE
- VISIT

Right:
- search
- cart
- favorites

On mobile, simplify the navigation rather than shrinking everything.

### 2. Hero — poster composition

Do NOT use a standard centered hero.

Create:
- small metadata row: LOCAL OBJECTS / COTONOU and date
- enormous typography:
  - EVERYDAY
  - OBJECTS.
- small vertical side label: A DIFFERENT KIND OF CATALOGUE
- a large product photograph positioned toward the right
- a large electric-cyan geometric field behind it
- a vivid tangerine geometric field crossing another area
- the product photograph slightly rotated and visually breaking the grid
- small product metadata over/near the image
- a short explanatory paragraph positioned independently from the main title

The hero should feel like a printed poster expanded into a digital storefront.

### 3. Catalogue index

Dark ultramarine section.

Heading:
- 01 / CURRENT INDEX
- Find your signal.

Short explanatory text.

Then create a **vertical product index**, not a card grid.

Each row contains:
- number: 01, 02, 03
- thumbnail
- product name
- category
- short material/format information
- price
- arrow icon

Rows should have strong horizontal separators.

Hover/tap behavior:
- row subtly changes background or shifts horizontally;
- image can slightly scale;
- arrow moves a few pixels;
- never use excessive animation.

The second product may receive a full tangerine background to create hierarchy.

### 4. Product detail interaction — REQUIRED

This is a critical part of the prototype.

When a user taps/clicks a product row, open a **full contextual product sheet/modal**.

It must not be a generic browser alert.

The product sheet must visually belong to the Spectrum Index storefront:
- butter-yellow / warm-paper panel;
- ultramarine product area;
- electric-cyan close button;
- tangerine primary action;
- sharp editorial geometry rather than generic rounded SaaS modal styling.

The product sheet must contain:
- large product image
- product name
- product ID
- category
- price
- description
- color swatches
- available sizes/formats
- product details such as material, availability, origin
- optional ingredients section when the item is a food/restaurant item
- quantity control
- favorite button
- Add to cart button

Close behavior:
- close button
- clicking backdrop
- Escape key

On mobile:
- sheet becomes a large bottom/full-screen panel;
- image remains prominent;
- content scrolls naturally;
- close button stays easy to reach.

### 5. House section

Warm butter background.

Use a strong split layout:
- left: large typography `COLOR IS A SIGNAL.`
- short Maison Naya description
- statistics: 4.8 / 126 / 08—20
- right: large interior image on electric cyan background
- vertical Maison Naya label
- location marker

Do not turn this into a normal information card.

### 6. Poster section

Vivid tangerine background.

Huge typography:
- LOCAL /
- NOT ORDINARY

Place a large electric-cyan circle behind/near the typography with an ultramarine offset shadow.

Add a short sentence explaining that a local selection can have a global visual identity without losing its address.

### 7. Visit section

Warm paper background.

Large heading:
- COME
- FIND US.

Address block:
- Maison Naya
- Haie Vive, Cotonou
- Open today · 08:00 — 20:00

### 8. Footer

Dark ultramarine.

Minimal:
- MN / MAISON NAYA
- Vitrine Loka
- © 2026

## Product data

Use these demo products:

1. Everyday Form
- ID: SO-01
- category: ACCESSOIRE
- price: 45 000 FCFA
- colors: ultramarine, tangerine, warm paper
- sizes: S, M, L, XL
- material: Coton & textile mixte
- availability: En stock
- origin: Sélection locale

2. Soft Structure
- ID: SO-02
- category: COLLECTION
- price: 32 000 FCFA
- colors: electric cyan, butter, ultramarine
- size: Unique
- material: Textile souple
- availability: En stock
- edition: Drop 02

3. Signal Piece
- ID: SO-03
- category: ÉDITION
- price: 58 000 FCFA
- colors: tangerine, soft pink, ultramarine
- sizes: M, L
- material: Textile premium
- availability: Dernières pièces
- edition: Limited

Use visually coherent image placeholders if real image URLs are unavailable. Do not depend on external image URLs for the basic layout to work.

## Motion

Use restrained art-direction motion:
- image slightly shifts on hover;
- index rows slide a few pixels;
- product sheet enters with a short editorial slide/fade;
- background geometry may move very slightly;
- no heavy parallax;
- no animations that delay interaction.

Respect `prefers-reduced-motion`.

## Mobile requirements

The phone version is extremely important.

At approximately 390px width:
- typography must remain intentionally oversized but not overflow horizontally;
- hero becomes a vertical poster composition;
- product index remains a list, not a tiny desktop table;
- thumbnails stay visible;
- price can remain visible while secondary metadata can simplify;
- product sheet becomes full-screen or near full-screen;
- buttons remain thumb-friendly;
- no horizontal page overflow;
- Visit section becomes a clean vertical composition.

## UX requirement

Every visible product in the catalogue must be interactive.

There must be no fake dead product cards.

The user must be able to:
1. see a product;
2. tap it;
3. open its contextual detail sheet;
4. inspect visual/details/variants;
5. change quantity;
6. close the sheet;
7. reopen another product.

The Add to cart button can be a front-end demo action, but it must visibly respond (for example with a short “Ajouté au panier” state). Do not simulate a real payment.

## Quality bar

The result should look like a real art-directed storefront prototype, not a generic AI landing page.

Prioritize:
- composition;
- typography;
- visual hierarchy;
- unexpected but controlled spacing;
- strong color blocking;
- product photography as an object;
- responsive behavior;
- meaningful interaction.

Return ONLY the complete `index.html` code.
