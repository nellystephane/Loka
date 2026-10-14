export type StorefrontActivity = 'boutique' | 'restaurant' | 'hotel' | 'livraison' | 'agence_livraison' | 'presence';
export type TemplatePlan = 'starter' | 'pro' | 'business';
export type TemplateDensity = 'compact' | 'balanced' | 'spacious';
export type HeroComposition = 'split' | 'immersive' | 'editorial' | 'mosaic' | 'compact';
export type NavigationComposition = 'inline' | 'floating' | 'sidebar' | 'editorial' | 'compact';
export type MediaBehavior = 'cover' | 'contained' | 'mosaic' | 'split' | 'gallery';
export type MotionProfile = 'restrained' | 'fluid' | 'immersive';
export type MobileStrategy = 'reflow' | 'stack' | 'rail' | 'bottom-actions';

export type StorefrontSection =
  | 'hero'
  | 'identity'
  | 'collections'
  | 'catalogue'
  | 'menu'
  | 'rooms'
  | 'services'
  | 'story'
    | 'signature'
  | 'gallery'
  | 'location'
  | 'reviews'
  | 'booking'
  | 'delivery-zones'
  | 'fleet'
  | 'contact'
  | 'footer';

export interface StorefrontTemplateDefinition {
  id: string;
  activity: StorefrontActivity;
  label: string;
  description: string;
  minimumPlan: TemplatePlan;
  composition: string;
  density: TemplateDensity;
  hero: HeroComposition;
  navigation: NavigationComposition;
  sections: StorefrontSection[];
  typography: 'neutral' | 'editorial' | 'display' | 'hospitality';
  mediaBehavior: MediaBehavior;
  motionProfile: MotionProfile;
  mobileStrategy: MobileStrategy;
  supportsDark: boolean;
  signature: string;
}

const definitions: StorefrontTemplateDefinition[] = [
  // Boutique
  { id: 'boutique_minimal', activity: 'boutique', label: 'Minimal', description: 'Lecture nette et catalogue direct.', minimumPlan: 'starter', composition: 'hero + catalogue', density: 'balanced', hero: 'split', navigation: 'inline', sections: ['hero', 'identity', 'catalogue', 'reviews', 'contact', 'footer'], typography: 'neutral', mediaBehavior: 'contained', motionProfile: 'restrained', mobileStrategy: 'reflow', supportsDark: false, signature: 'précision et calme' },
  { id: 'boutique_catalogue', activity: 'boutique', label: 'Catalogue', description: 'Le produit domine la hiérarchie.', minimumPlan: 'starter', composition: 'navigation + grille + rails', density: 'compact', hero: 'compact', navigation: 'compact', sections: ['hero', 'collections', 'catalogue', 'reviews', 'contact', 'footer'], typography: 'neutral', mediaBehavior: 'cover', motionProfile: 'restrained', mobileStrategy: 'rail', supportsDark: false, signature: 'shopping rapide' },
  { id: 'boutique_editorial', activity: 'boutique', label: 'Editorial', description: 'Une vitrine qui raconte la sélection.', minimumPlan: 'pro', composition: 'hero éditorial + collections', density: 'spacious', hero: 'editorial', navigation: 'editorial', sections: ['hero', 'story', 'collections', 'catalogue', 'gallery', 'reviews', 'contact', 'footer'], typography: 'editorial', mediaBehavior: 'split', motionProfile: 'fluid', mobileStrategy: 'stack', supportsDark: true, signature: 'magazine de marque' },
  { id: 'boutique_neo_flux', activity: 'boutique', label: 'Neo Flux', description: 'Une vitrine expressive, graphique et contemporaine.', minimumPlan: 'business', composition: 'art-direction + commerce', density: 'spacious', hero: 'mosaic', navigation: 'floating', sections: ['hero', 'identity', 'collections', 'catalogue', 'gallery', 'story', 'location', 'contact', 'footer'], typography: 'display', mediaBehavior: 'mosaic', motionProfile: 'immersive', mobileStrategy: 'stack', supportsDark: true, signature: 'impact contemporain' },
  { id: 'boutique_orbit_glass', activity: 'boutique', label: 'Orbit Glass', description: 'Une vitrine spatiale, tactile et app-like avec profondeur et verre.', minimumPlan: 'business', composition: 'spatial commerce interface', density: 'spacious', hero: 'split', navigation: 'floating', sections: ['hero', 'identity', 'collections', 'catalogue', 'story', 'location', 'contact', 'footer'], typography: 'display', mediaBehavior: 'split', motionProfile: 'fluid', mobileStrategy: 'bottom-actions', supportsDark: false, signature: 'commerce spatial' },
  { id: 'boutique_float_form', activity: 'boutique', label: 'Float Form', description: 'Produits mis en scène comme des objets flottants, avec profondeur, cartes sculptées et mouvement gracieux.', minimumPlan: 'business', composition: 'sculptural product showcase', density: 'spacious', hero: 'mosaic', navigation: 'floating', sections: ['hero', 'collections', 'catalogue', 'story', 'reviews', 'contact', 'footer'], typography: 'display', mediaBehavior: 'contained', motionProfile: 'immersive', mobileStrategy: 'stack', supportsDark: true, signature: 'produit sculptural' },
  { id: 'boutique_pop_object', activity: 'boutique', label: 'Pop Object', description: 'Une direction artistique colorée où les produits deviennent des objets graphiques et débordent de leur scène.', minimumPlan: 'business', composition: 'art-directed product campaign', density: 'spacious', hero: 'mosaic', navigation: 'floating', sections: ['hero', 'identity', 'collections', 'catalogue', 'gallery', 'story', 'contact', 'footer'], typography: 'display', mediaBehavior: 'mosaic', motionProfile: 'immersive', mobileStrategy: 'stack', supportsDark: true, signature: 'produit comme objet graphique' },  { id: 'boutique_lifestyle', activity: 'boutique', label: 'Lifestyle', description: 'Images, collections et rythme immersif.', minimumPlan: 'pro', composition: 'immersive media + collections', density: 'spacious', hero: 'immersive', navigation: 'floating', sections: ['hero', 'collections', 'gallery', 'catalogue', 'story', 'reviews', 'contact', 'footer'], typography: 'display', mediaBehavior: 'mosaic', motionProfile: 'immersive', mobileStrategy: 'rail', supportsDark: true, signature: 'univers visuel' },
  { id: 'boutique_spectrum_index', activity: 'boutique', label: 'Spectrum Index', description: 'Un index éditorial très coloré où les produits se découvrent comme une série numérotée.', minimumPlan: 'business', composition: 'editorial product index', density: 'spacious', hero: 'split', navigation: 'editorial', sections: ['hero','catalogue','story','contact','footer'], typography: 'display', mediaBehavior: 'split', motionProfile: 'immersive', mobileStrategy: 'stack', supportsDark: true, signature: 'catalogue comme une série visuelle' },
  { id: 'boutique_prism_vault', activity: 'boutique', label: 'Prism Vault', description: 'Une vitrine architecturale aux plans diagonaux et aux produits mis en scène comme des objets.', minimumPlan: 'business', composition: 'architectural product stage', density: 'spacious', hero: 'mosaic', navigation: 'floating', sections: ['hero', 'identity', 'catalogue', 'story', 'gallery', 'location', 'contact', 'footer'], typography: 'display', mediaBehavior: 'mosaic', motionProfile: 'immersive', mobileStrategy: 'stack', supportsDark: true, signature: 'architecture et matière' },
  { id: 'boutique_kinetic_atelier', activity: 'boutique', label: 'Kinetic Atelier', description: 'Une vitrine contemporaine où typographie, produits et motion design forment une séquence vivante.', minimumPlan: 'business', composition: 'kinetic editorial commerce', density: 'spacious', hero: 'mosaic', navigation: 'floating', sections: ['hero', 'identity', 'collections', 'catalogue', 'story', 'gallery', 'contact', 'footer'], typography: 'display', mediaBehavior: 'mosaic', motionProfile: 'immersive', mobileStrategy: 'stack', supportsDark: false, signature: 'motion et séquence' },
  { id: 'boutique_brand', activity: 'boutique', label: 'Brand', description: 'Une vitrine pensée comme un univers de marque.', minimumPlan: 'business', composition: 'brand narrative + commerce', density: 'spacious', hero: 'mosaic', navigation: 'floating', sections: ['hero', 'story', 'collections', 'catalogue', 'gallery', 'reviews', 'contact', 'footer'], typography: 'display', mediaBehavior: 'mosaic', motionProfile: 'immersive', mobileStrategy: 'stack', supportsDark: true, signature: 'identité forte' },
  { id: 'boutique_magazine', activity: 'boutique', label: 'Magazine', description: 'Une composition éditoriale à forte personnalité.', minimumPlan: 'business', composition: 'editorial magazine', density: 'spacious', hero: 'editorial', navigation: 'sidebar', sections: ['hero', 'story', 'collections', 'gallery', 'catalogue', 'reviews', 'contact', 'footer'], typography: 'editorial', mediaBehavior: 'split', motionProfile: 'fluid', mobileStrategy: 'stack', supportsDark: true, signature: 'direction artistique' },
  { id: 'boutique_immersive', activity: 'boutique', label: 'Immersive', description: 'Grande image, profondeur et narration.', minimumPlan: 'business', composition: 'full-bleed experience', density: 'spacious', hero: 'immersive', navigation: 'floating', sections: ['hero', 'story', 'gallery', 'collections', 'catalogue', 'reviews', 'contact', 'footer'], typography: 'display', mediaBehavior: 'gallery', motionProfile: 'immersive', mobileStrategy: 'stack', supportsDark: true, signature: 'impact visuel' },
  { id: 'boutique_compact', activity: 'boutique', label: 'Compact', description: 'Une vitrine dense et rapide à parcourir.', minimumPlan: 'starter', composition: 'compact commerce', density: 'compact', hero: 'compact', navigation: 'compact', sections: ['hero', 'catalogue', 'contact', 'footer'], typography: 'neutral', mediaBehavior: 'cover', motionProfile: 'restrained', mobileStrategy: 'reflow', supportsDark: false, signature: 'efficacité' },

  // Restaurant
  { id: 'restaurant_tempo', activity: 'restaurant', label: 'Tempo', description: 'Une vitrine restaurant contemporaine où le menu, le service et la réservation sont orchestrés dans un rythme visuel.', minimumPlan: 'pro', composition: 'kinetic dining experience', density: 'spacious', hero: 'mosaic', navigation: 'floating', sections: ['hero', 'identity', 'menu', 'story', 'booking', 'location', 'reviews', 'contact', 'footer'], typography: 'display', mediaBehavior: 'mosaic', motionProfile: 'immersive', mobileStrategy: 'stack', supportsDark: true, signature: 'rythme culinaire' },
  { id: 'restaurant_editorial_dining', activity: 'restaurant', label: 'Editorial Dining', description: 'Une vitrine éditoriale centrée sur la maison, le plat signature et la lecture de la carte.', minimumPlan: 'pro', composition: 'editorial dining narrative', density: 'spacious', hero: 'editorial', navigation: 'editorial', sections: ['hero', 'identity', 'story', 'signature', 'menu', 'services', 'booking', 'location', 'contact', 'footer'], typography: 'editorial', mediaBehavior: 'split', motionProfile: 'fluid', mobileStrategy: 'bottom-actions', supportsDark: false, signature: 'récit culinaire' },
  { id: 'restaurant_bistro', activity: 'restaurant', label: 'Bistro', description: 'Lieu, menu et informations essentielles.', minimumPlan: 'starter', composition: 'hero + menu', density: 'balanced', hero: 'split', navigation: 'inline', sections: ['hero', 'identity', 'menu', 'location', 'reviews', 'contact', 'footer'], typography: 'hospitality', mediaBehavior: 'cover', motionProfile: 'restrained', mobileStrategy: 'stack', supportsDark: false, signature: 'chaleur maîtrisée' },
  { id: 'restaurant_menu', activity: 'restaurant', label: 'Menu', description: 'Le menu devient le centre de la vitrine.', minimumPlan: 'starter', composition: 'menu-first', density: 'compact', hero: 'compact', navigation: 'compact', sections: ['hero', 'menu', 'booking', 'location', 'reviews', 'contact', 'footer'], typography: 'neutral', mediaBehavior: 'contained', motionProfile: 'restrained', mobileStrategy: 'reflow', supportsDark: false, signature: 'lecture rapide' },
  { id: 'restaurant_gastronomie', activity: 'restaurant', label: 'Gastronomie', description: 'Une expérience éditoriale autour du lieu et de la cuisine.', minimumPlan: 'pro', composition: 'editorial hospitality', density: 'spacious', hero: 'editorial', navigation: 'editorial', sections: ['hero', 'story', 'menu', 'gallery', 'booking', 'location', 'reviews', 'contact', 'footer'], typography: 'hospitality', mediaBehavior: 'split', motionProfile: 'fluid', mobileStrategy: 'stack', supportsDark: true, signature: 'élégance culinaire' },
  { id: 'restaurant_experience', activity: 'restaurant', label: 'Experience', description: 'Le lieu, la réservation et l\'expérience avant le menu.', minimumPlan: 'business', composition: 'immersive hospitality', density: 'spacious', hero: 'immersive', navigation: 'floating', sections: ['hero', 'identity', 'gallery', 'story', 'menu', 'booking', 'location', 'reviews', 'contact', 'footer'], typography: 'display', mediaBehavior: 'gallery', motionProfile: 'immersive', mobileStrategy: 'bottom-actions', supportsDark: true, signature: 'expérience du lieu' },
  { id: 'restaurant_premium', activity: 'restaurant', label: 'Premium', description: 'Une mise en scène sophistiquée pour l\'établissement.', minimumPlan: 'business', composition: 'luxury hospitality', density: 'spacious', hero: 'mosaic', navigation: 'floating', sections: ['hero', 'story', 'gallery', 'menu', 'booking', 'location', 'reviews', 'contact', 'footer'], typography: 'hospitality', mediaBehavior: 'mosaic', motionProfile: 'immersive', mobileStrategy: 'bottom-actions', supportsDark: true, signature: 'hospitalité haut de gamme' },
  { id: 'restaurant_story', activity: 'restaurant', label: 'Story', description: 'La cuisine et l\'histoire du restaurant au premier plan.', minimumPlan: 'pro', composition: 'story-led restaurant', density: 'spacious', hero: 'editorial', navigation: 'editorial', sections: ['hero', 'story', 'gallery', 'menu', 'booking', 'reviews', 'contact', 'footer'], typography: 'editorial', mediaBehavior: 'split', motionProfile: 'fluid', mobileStrategy: 'stack', supportsDark: true, signature: 'récit de maison' },
  { id: 'restaurant_night', activity: 'restaurant', label: 'Night', description: 'Une ambiance sombre et immersive pour les lieux de soirée.', minimumPlan: 'pro', composition: 'dark experience', density: 'spacious', hero: 'immersive', navigation: 'floating', sections: ['hero', 'identity', 'gallery', 'menu', 'booking', 'location', 'contact', 'footer'], typography: 'display', mediaBehavior: 'gallery', motionProfile: 'immersive', mobileStrategy: 'bottom-actions', supportsDark: true, signature: 'ambiance nocturne' },

  // Hotel
  { id: 'hotel_minimal', activity: 'hotel', label: 'Minimal', description: 'Chambres, services et réservation sans distraction.', minimumPlan: 'starter', composition: 'hotel essentials', density: 'balanced', hero: 'split', navigation: 'inline', sections: ['hero', 'rooms', 'services', 'location', 'reviews', 'booking', 'footer'], typography: 'neutral', mediaBehavior: 'cover', motionProfile: 'restrained', mobileStrategy: 'reflow', supportsDark: false, signature: 'simplicité hôtelière' },
  { id: 'hotel_business', activity: 'hotel', label: 'Business', description: 'Réservation et informations pratiques en priorité.', minimumPlan: 'starter', composition: 'booking-first', density: 'compact', hero: 'compact', navigation: 'compact', sections: ['hero', 'rooms', 'services', 'booking', 'location', 'reviews', 'contact', 'footer'], typography: 'neutral', mediaBehavior: 'contained', motionProfile: 'restrained', mobileStrategy: 'bottom-actions', supportsDark: false, signature: 'efficacité professionnelle' },
  { id: 'hotel_boutique', activity: 'hotel', label: 'Boutique', description: 'Une identité visuelle plus intime et éditoriale.', minimumPlan: 'pro', composition: 'boutique hospitality', density: 'spacious', hero: 'editorial', navigation: 'editorial', sections: ['hero', 'story', 'rooms', 'gallery', 'services', 'location', 'reviews', 'booking', 'footer'], typography: 'hospitality', mediaBehavior: 'split', motionProfile: 'fluid', mobileStrategy: 'stack', supportsDark: true, signature: 'hospitalité intime' },
  { id: 'hotel_luxury', activity: 'hotel', label: 'Luxury', description: 'Une expérience de destination avant la réservation.', minimumPlan: 'business', composition: 'destination experience', density: 'spacious', hero: 'immersive', navigation: 'floating', sections: ['hero', 'story', 'rooms', 'gallery', 'services', 'location', 'reviews', 'booking', 'contact', 'footer'], typography: 'display', mediaBehavior: 'gallery', motionProfile: 'immersive', mobileStrategy: 'bottom-actions', supportsDark: true, signature: 'destination' },
  { id: 'hotel_resort', activity: 'hotel', label: 'Resort', description: 'Séjour, espaces, expériences et destination.', minimumPlan: 'pro', composition: 'resort journey', density: 'spacious', hero: 'mosaic', navigation: 'floating', sections: ['hero', 'story', 'gallery', 'rooms', 'services', 'location', 'reviews', 'booking', 'footer'], typography: 'hospitality', mediaBehavior: 'mosaic', motionProfile: 'immersive', mobileStrategy: 'stack', supportsDark: true, signature: 'évasion' },
  { id: 'hotel_gallery', activity: 'hotel', label: 'Gallery', description: 'La photographie devient la première porte d\'entrée.', minimumPlan: 'business', composition: 'gallery-led hotel', density: 'spacious', hero: 'mosaic', navigation: 'editorial', sections: ['hero', 'gallery', 'rooms', 'story', 'services', 'booking', 'location', 'footer'], typography: 'editorial', mediaBehavior: 'gallery', motionProfile: 'fluid', mobileStrategy: 'stack', supportsDark: true, signature: 'photographie' },
  { id: 'hotel_escape', activity: 'hotel', label: 'Escape', description: 'Une narration centrée sur l\'évasion et la destination.', minimumPlan: 'business', composition: 'escape narrative', density: 'spacious', hero: 'immersive', navigation: 'floating', sections: ['hero', 'story', 'gallery', 'services', 'rooms', 'location', 'booking', 'reviews', 'footer'], typography: 'display', mediaBehavior: 'gallery', motionProfile: 'immersive', mobileStrategy: 'bottom-actions', supportsDark: true, signature: 'évasion immersive' },
  { id: 'hotel_heritage', activity: 'hotel', label: 'Heritage', description: 'Architecture, histoire et hospitalité réunies.', minimumPlan: 'pro', composition: 'heritage editorial', density: 'spacious', hero: 'editorial', navigation: 'sidebar', sections: ['hero', 'story', 'gallery', 'rooms', 'services', 'location', 'reviews', 'booking', 'footer'], typography: 'editorial', mediaBehavior: 'split', motionProfile: 'fluid', mobileStrategy: 'stack', supportsDark: true, signature: 'patrimoine' },
];

export const STOREFRONT_TEMPLATES = definitions;

export function getTemplateDefinition(id: string) {
  return STOREFRONT_TEMPLATES.find((template) => template.id === id);
}

export function getTemplatesForActivity(activity: StorefrontActivity) {
  return STOREFRONT_TEMPLATES.filter((template) => template.activity === activity);
}
