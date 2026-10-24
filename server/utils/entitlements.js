const { planActif } = require('./templates');
const { palierDuPlan } = require('./tarificationPro');
const droits = (espace) => { const plan=planActif(espace); const rang={presence:1,starter:1,pro:2,business:3}[plan]||0; return { plan:plan||null, vitrine:rang>=1, templates:rang>=1, templatesPro:rang>=2, templatesBusiness:rang>=3, personnalisationCouleurs:rang>=3, reservationRestaurant:rang>=3, miseEnAvant:rang>=2, prioriteAnnuaire:rang>=3 }; };
const normaliserPlan=plan=>plan?palierDuPlan(plan):null;
module.exports={droits,normaliserPlan};
