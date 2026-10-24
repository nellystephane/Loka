const GRILLE_PRO = {
  vente: { starter: { mensuel: 5000, annuel: 50000 }, pro: { mensuel: 10000, annuel: 100000 }, business: { mensuel: 20000, annuel: 200000 } },
  restauration: { starter: { mensuel: 5000, annuel: 50000 }, pro: { mensuel: 10000, annuel: 100000 }, business: { mensuel: 20000, annuel: 200000 } },
  hotel: { starter: { mensuel: 10000, annuel: 100000 }, pro: { mensuel: 25000, annuel: 250000 }, business: { mensuel: 50000, annuel: 500000 } },
  livraison: { pro: { mensuel: 3000, annuel: 30000 } },
  agence_livraison: { pro: { mensuel: 3000, annuel: 30000 } },
  livreur_individuel: { pro: { mensuel: 3000, annuel: 30000 } },
  presence: { presence: { mensuel: 2500, annuel: 25000 } }
};

const plan = (palier, periode) => `${palier}_${periode}`;
const prixPlan = (espaceType, palier, periode='mensuel') => GRILLE_PRO[espaceType]?.[palier]?.[periode] ?? null;
const priorite = (p) => ({ starter: 1, pro: 2, business: 3 }[p] || 0);
const palierDuPlan = (p) => p ? p.replace(/_(mensuel|annuel)$/, '') : null;

module.exports = { GRILLE_PRO, plan, prixPlan, priorite, palierDuPlan };
