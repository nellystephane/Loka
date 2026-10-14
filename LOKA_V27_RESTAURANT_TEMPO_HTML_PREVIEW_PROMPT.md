# Loka V27 — Restaurant Tempo — HTML Preview Prompt

Create a standalone responsive HTML/CSS/JS preview for a Loka public restaurant storefront called **Restaurant Tempo**.

## Direction
Modern motion-led hospitality, not a generic restaurant template. Avoid cream/beige palettes. Use deep forest/near-black, clean white-green surfaces, mint accent and a small saffron yellow secondary accent. The palette belongs only to the public storefront.

## Structure
1. Sticky navigation: restaurant mark, Menu, La maison, Réserver, open status.
2. Hero: huge kinetic typography “GOOD FOOD MOVES.”, restaurant/location metadata, CTA Menu + Réserver, large food image with clipped geometric frame, rotating rings, floating label and circular restaurant stamp.
3. Animated marquee.
4. House/introduction section explaining the restaurant identity.
5. Menu section with tabs: Plats, Entrées, Desserts, Boissons. Use asymmetrical editorial dish composition rather than a normal ecommerce grid. Dish cards show category, name, price, image, featured badge when relevant.
6. Service section: Sur place, À emporter, Livraison, with orbital motion graphic.
7. Reservation section: date, time, party size and availability CTA. Make clear that reservation fees, if any, are separate from food payment.
8. Location section with stylized map, address, hours and contact.
9. Footer.

## Restaurant-specific rules
- Content model is restaurant-specific: menu items, categories, ingredients, allergens, spicy indicator, availability, featured dishes, service modes, opening hours, reservation categories and location.
- Do not expose boutique concepts such as product sizes/colors/collections unless relevant to a food item.
- Clicking a dish opens a rich dish detail/quick view with photo, name, category, price, description, ingredients, allergen information, availability and service information.
- Reservation is a separate journey from food ordering/payment.
- If a reservation requires a fee, opening a payment interface must never be treated as confirmation; confirmation comes from backend/payment state.
- Template styling affects only the public restaurant storefront, not the Loka dashboard.
- Respect `prefers-reduced-motion`.
- Mobile must be designed intentionally, not simply shrink desktop.

## Demo restaurant
Chez Marcel · Cuisine béninoise contemporaine · Cotonou, Akpakpa.
Use realistic French labels and FCFA pricing.
