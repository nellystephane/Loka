# LOKA V26 — KINETIC ATELIER — HTML PREVIEW PROMPT

Create a single responsive HTML/CSS/JS visual prototype for the public Boutique storefront template **Kinetic Atelier** in Loka.

## Direction

Do NOT reproduce a generic ecommerce page. Build an art-directed, contemporary storefront where motion design is part of the identity.

The visual language is:
- warm off-white / paper background
- near-black typography and navigation
- signal red accent
- thin technical grid lines
- oversized condensed-feeling display typography
- geometric orbital lines
- editorial sequencing and numbered sections
- sharp rectangular controls rather than rounded SaaS cards
- premium fashion/art-direction feel
- product imagery treated as large visual objects

This template must be clearly different from Prism Vault. Prism Vault is architectural and layered; Kinetic Atelier is **typographic, kinetic and sequence-driven**.

## Hero

Create a large hero around the phrase:

**MOVE THE FORM.**

Use:
- giant typography
- large product image on the right
- animated orbital circles
- technical grid background
- oversized ghost number `026`
- small metadata at top
- vertical product label
- price marker
- scroll cue
- slow geometric background movement

The product image should have subtle continuous breathing motion. On desktop, pointer movement may create a very subtle parallax shift.

## Motion design

Motion must be visible but refined:
- continuous horizontal marquee
- slow rotating orbital rings
- breathing product image
- hover image scale
- light sweep across product images
- CTA movement on hover
- subtle hero geometry drift
- animated central `K` motion study section

Use `prefers-reduced-motion: reduce` to disable/reduce all non-essential animations.

## Sections

1. Hero — `MOVE THE FORM.`
2. Continuous marquee
3. Editorial introduction — `Designed to be seen in motion.`
4. Product sequence — `THE SEQUENCE.`
5. Motion study — `EVERY SECOND COUNTS.`
6. Store identity / location — `A STORE IN MOTION.`
7. Minimal footer

## Product presentation

Use four products with asymmetric composition. Do NOT use a standard equal four-card grid.

Each product must show:
- image
- index number
- availability label
- name
- category
- price

Clicking a product must open a product quick-view modal containing:
- image
- name
- price
- description
- colors
- sizes/formats
- relevant attributes
- availability
- primary action

## Responsive behavior

Mobile must be intentionally designed, not merely scaled down:
- compact navigation
- hero typography remains dominant
- product image moves below hero copy
- two-column product rhythm where possible
- motion study becomes stacked
- location section becomes single column
- footer becomes vertical

## Important Loka rule

This is a **public storefront template only**. Do not apply its red/black/paper visual identity to the general Loka dashboard, forms, checkout, account pages or professional management UI.

The Loka platform design system remains independent.

## Content architecture

The visual prototype should represent data coming from the Boutique catalogue engine. Do not hardcode the architecture around fashion only. The real renderer must remain capable of using product names, prices, photos, variants, categories, collections, attributes and availability supplied by the merchant.
