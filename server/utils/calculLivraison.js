const Livreur = require('../models/Livreur');
const AgenceLivraison = require('../models/AgenceLivraison');

const haversineKm = (a,b,c,d) => {
  if (![a,b,c,d].every(Number.isFinite)) return null;
  const R=6371, rad=x=>x*Math.PI/180, da=rad(c-a), db=rad(d-b);
  const h=Math.sin(da/2)**2+Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(db/2)**2;
  return R*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
};

const estimerTarif = async ({ livreurId, agenceId, origine, destination, supplementKm=100 }) => {
  let base=0;
  if(livreurId){ const l=await Livreur.findOne({utilisateur:livreurId}); if(!l) throw new Error('Livreur introuvable.'); base=l.tarifBase||0; }
  else if(agenceId){ const a=await AgenceLivraison.findById(agenceId); if(!a) throw new Error('Agence introuvable.'); base=500; }
  const distance=haversineKm(Number(origine?.latitude),Number(origine?.longitude),Number(destination?.latitude),Number(destination?.longitude));
  const supplement=distance==null?0:Math.max(0,Math.ceil(Math.max(0,distance-3))*supplementKm);
  return {base,distanceKm:distance, supplement, total:base+supplement};
};
module.exports={haversineKm,estimerTarif};
