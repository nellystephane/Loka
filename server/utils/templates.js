// Bibliothèque de vitrines. Un template est une structure d'expérience,
// pas seulement une palette. Le frontend pourra ajouter autant de définitions
// que nécessaire sans changer le modèle StorefrontConfig.
const TEMPLATES = {
  vente: [
    'boutique_editorial', 'boutique_catalogue', 'boutique_minimal', 'boutique_lifestyle',
    'boutique_brand', 'boutique_magazine', 'boutique_immersive', 'boutique_compact'
  ],
  restauration: [
    'restaurant_gastronomie', 'restaurant_bistro', 'restaurant_urban', 'restaurant_experience',
    'restaurant_premium', 'restaurant_menu', 'restaurant_story', 'restaurant_night'
  ],
  hotel: [
    'hotel_luxury', 'hotel_resort', 'hotel_boutique', 'hotel_business', 'hotel_minimal',
    'hotel_gallery', 'hotel_escape', 'hotel_heritage'
  ],
  livraison: [
    'livraison_express', 'livraison_independent', 'livraison_fleet', 'livraison_agency',
    'livraison_local', 'livraison_service'
  ],
  agence_livraison: [
    'agence_fleet', 'agence_express', 'agence_logistics', 'agence_business', 'agence_local'
  ],
  presence: [
    'pro_portfolio', 'pro_services', 'pro_local', 'pro_personal_brand', 'pro_editorial'
  ]
};

const PLANS = ['starter', 'pro', 'business'];

const TEMPLATE_PLAN_MINIMUM = {};
for (const type of Object.keys(TEMPLATES)) {
  for (const id of TEMPLATES[type]) {
    TEMPLATE_PLAN_MINIMUM[id] = id.includes('business') || id.includes('luxury') || id.includes('premium') || id.includes('immersive') || id.includes('magazine') || id.includes('gallery') || id.includes('escape') || id.includes('experience') || id.includes('brand') ? 'business' : id.includes('editorial') || id.includes('lifestyle') || id.includes('story') || id.includes('night') || id.includes('resort') || id.includes('boutique') || id.includes('fleet') || id.includes('logistics') || id.includes('portfolio') || id.includes('personal') ? 'pro' : 'starter';
  }
}

const planActif = (espace) => {
  const a = espace?.abonnementPro;
  if (!a?.actif || !a.dateFin || new Date(a.dateFin) <= new Date()) return null;
  return String(a.plan || '').replace(/_(mensuel|annuel)$/, '') || null;
};
const rang = (plan) => plan === 'presence' ? 1 : PLANS.indexOf(plan) + 1;
const minimumTemplate = (template) => TEMPLATE_PLAN_MINIMUM[template] || 'starter';
const templateAutorise = (template, plan) => !!template && !!TEMPLATE_PLAN_MINIMUM[template] && rang(plan || 'starter') >= rang(minimumTemplate(template));
const templatesPourPlan = (type, plan) => (TEMPLATES[type] || []).map(id => ({ id, minimumPlan: minimumTemplate(id), accessible: templateAutorise(id, plan) }));

module.exports = { TEMPLATES, PLANS, TEMPLATE_PLAN_MINIMUM, planActif, templateAutorise, templatesPourPlan, minimumTemplate };
