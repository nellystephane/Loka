# Loka V24 — HTML Preview Prompt

Create ONE complete standalone `index.html` that prototypes the new Loka adaptive boutique content system. This is not a generic ecommerce admin dashboard and not a copy of an existing brand.

## Core idea

The merchant should feel that Loka is asking only for the information needed to publish a product. The storefront templates then use the available content intelligently.

Build a mobile-first professional flow:

1. Boutique setup summary
2. Add product — Essential
3. Optional Variants
4. Optional Characteristics suggested by product type
5. Optional Organization with category/collection
6. Live "what the storefront can do" preview

## Important UX rule

Never present 40 mandatory fields. Start with:
- photos
- product name
- price
- description
- product type
- stock

Then progressively reveal relevant options.

If the product type is clothing, suggest attributes such as material, cut, season and care.
If food, suggest ingredients, allergens, volume, conservation and origin.
If electronics, suggest brand, model, capacity, compatibility, warranty and condition.
If jewelry, suggest material, stone, size, color and origin.
The merchant can skip every optional field.

## Organization

Show the difference between:
- category = durable product classification
- collection = curated selection
- new arrivals = automatic based on recent publication
- popular products = automatic based on available interaction data

Do not ask the merchant to manually fill "new arrivals".

## Visual direction

Do NOT reuse the palettes from previous Loka prototypes. Avoid the familiar purple/electric blue/acid green/coral combination. Choose a completely new restrained palette and make the composition itself original.

The preview should feel like a premium creative product, not a SaaS CRUD panel. Use strong typography, intentional whitespace, tactile cards, subtle depth and a distinctive layout.

## Live storefront preview

Include a small but real storefront preview that reacts to the entered content.
For example:
- adding a category changes the category rail
- adding a collection creates a collection section
- adding variants changes the product card
- entering ingredients creates an ingredients area
- removing a collection removes that section
- recent products can appear automatically under "Nouvelles arrivées"

The preview must never show an empty decorative section when there is no corresponding content.

## Product detail interaction

Clicking a product in the preview MUST open a contextual product detail panel/modal.
It must inherit the preview's visual language rather than looking like a generic browser modal.
It should support:
- product image
- name
- price
- category
- colors
- sizes/formats
- variants
- characteristics
- ingredients when available
- availability
- quantity controls
- add to cart
- close with X, Escape and backdrop click

## Technical constraints

- one standalone `index.html`
- HTML + CSS + vanilla JavaScript only
- no React
- no Vue
- no Tailwind
- no Bootstrap
- no external framework
- responsive mobile-first
- accessible buttons and form labels
- reduced-motion support
- all interactions must work locally

Return ONLY the complete `index.html` code.
