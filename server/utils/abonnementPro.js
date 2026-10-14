// ─── Grille tarifaire Pro des espaces métiers : Starter / Pro / Business ───
// `abonnementPro.plan` stocke le type complet du dernier paiement confirmé
// (ex: 'business_annuel'). Ces helpers en dérivent le palier et les droits
// associés, pour rester cohérents entre le contrôleur de paiement et les
// contrôleurs métier (produits, plats, chambres, tri de l'annuaire).

// Palier ('starter'/'pro'/'business') à partir d'un type complet ('pro_annuel' → 'pro')
const palierDuPlan = (plan) => (plan ? plan.replace(/_(mensuel|annuel)$/, '') : null);

// Rang de priorité pour le tri de l'annuaire public (0 = aucun abonnement actif)
const PRIORITE_PAR_PALIER = { starter: 1, pro: 2, business: 3 };

const prioriteDuPlan = (abonnementPro) => {
  if (!abonnementPro?.actif) return 0;
  return PRIORITE_PAR_PALIER[palierDuPlan(abonnementPro.plan)] || 0;
};

// La mise en avant des produits/plats/chambres est réservée aux paliers Pro et Business
const accordeMiseEnAvant = (abonnementPro) => {
  if (!abonnementPro?.actif) return false;
  return ['pro', 'business'].includes(palierDuPlan(abonnementPro.plan));
};

module.exports = { palierDuPlan, prioriteDuPlan, accordeMiseEnAvant };
