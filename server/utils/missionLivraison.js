const MissionLivraison = require('../models/MissionLivraison');
const DemandeLivraison = require('../models/DemandeLivraison');

const recalculerAllocations = async (mission) => {
  const total = Math.max(0, Number(mission.montantTotal) || 0);
  const stops = mission.stops.filter((stop) => stop.type === 'dropoff');
  if (mission.partageFrais === 'gratuit' || total === 0) {
    mission.stops.forEach((stop) => { stop.montantAlloue = 0; });
    await mission.save();
    return mission;
  }
  if (!stops.length) throw new Error('Au moins une destination est nécessaire pour répartir les frais.');
  if (mission.partageFrais === 'fixe') {
    const sum = stops.reduce((value, stop) => value + Math.max(0, Number(stop.montantAlloue) || 0), 0);
    if (Math.round(sum) !== Math.round(total)) throw new Error('En mode fixe, la somme des montants des destinations doit être égale au total de la mission.');
  } else {
    const weights = stops.map((stop) => Math.max(0, Number(stop.montantAlloue) || 0));
    const weightSum = weights.reduce((a, b) => a + b, 0);
    if (weightSum <= 0) throw new Error('Indiquez un poids de répartition positif pour chaque destination.');
    let allocated = 0;
    stops.forEach((stop, index) => {
      const amount = index === stops.length - 1 ? total - allocated : Math.round(total * weights[index] / weightSum);
      stop.montantAlloue = amount;
      allocated += amount;
    });
  }
  // Les montants sont imputés aux destinations uniquement, pas aux retraits.
  mission.stops.filter((stop) => stop.type === 'pickup').forEach((stop) => { stop.montantAlloue = 0; });
  await mission.save();
  return mission;
};

const validateStops = (stops) => {
  if (!Array.isArray(stops) || stops.length < 3) throw new Error('Une livraison groupée nécessite au moins deux retraits et une destination.');
  if (stops.length > 30) throw new Error('Une mission groupée ne peut pas dépasser 30 arrêts.');
  const pickups = stops.filter((stop) => stop.type === 'pickup');
  const dropoffs = stops.filter((stop) => stop.type === 'dropoff');
  if (pickups.length < 2 || dropoffs.length < 1) throw new Error('Ajoutez au moins deux retraits et une destination.');
  stops.forEach((stop, index) => {
    if (!['pickup', 'dropoff'].includes(stop.type)) throw new Error(`Type d’arrêt invalide à la position ${index + 1}.`);
    if (!String(stop.adresse?.ville || '').trim() || !String(stop.adresse?.details || '').trim()) throw new Error(`La ville et les indications locales sont obligatoires à l’arrêt ${index + 1}.`);
    if (stop.adresse.latitude != null && (Number(stop.adresse.latitude) < -90 || Number(stop.adresse.latitude) > 90)) throw new Error(`Latitude invalide à l’arrêt ${index + 1}.`);
    if (stop.adresse.longitude != null && (Number(stop.adresse.longitude) < -180 || Number(stop.adresse.longitude) > 180)) throw new Error(`Longitude invalide à l’arrêt ${index + 1}.`);
    stop.ordre = index + 1;
    stop.montantAlloue = stop.type === 'dropoff' ? Math.max(0, Number(stop.montantAlloue) || 0) : 0;
  });
};

const creerMissionGroupee = async ({ createur, livreur = null, agence = null, stops, montantTotal, partageFrais = 'proportionnel' }) => {
  if (!['proportionnel', 'fixe', 'gratuit'].includes(partageFrais)) throw new Error('Mode de répartition des frais invalide.');
  if (partageFrais === 'gratuit') montantTotal = 0;
  if (!Number.isFinite(Number(montantTotal)) || Number(montantTotal) < 0) throw new Error('Le montant total doit être positif ou nul.');
  validateStops(stops);
  const mission = await MissionLivraison.create({ createur, livreur, agence, stops, montantTotal: Number(montantTotal), partageFrais, statut: livreur ? 'assignée' : 'en_attente' });
  try { return await recalculerAllocations(mission); }
  catch (error) { await MissionLivraison.deleteOne({ _id: mission._id }); throw error; }
};

const rattacherDemandeMission = async ({ demandeId, missionId }) => {
  const [demande, mission] = await Promise.all([DemandeLivraison.findById(demandeId), MissionLivraison.findById(missionId)]);
  if (!demande || !mission) throw new Error('Demande ou mission introuvable.');
  if (['terminée', 'annulée'].includes(mission.statut)) throw new Error('Impossible de rattacher une demande à une mission clôturée.');
  if (demande.missionGroupee && demande.missionGroupee.toString() !== mission._id.toString()) throw new Error('Cette demande appartient déjà à une autre mission.');
  const commandId = demande.sourceId || demande._id;
  const commandModel = demande.sourceModel || 'DemandeLivraison';
  if (mission.stops.some((stop) => stop.commande?.id?.toString() === String(commandId))) throw new Error('Cette commande est déjà présente dans la mission.');
  const originalStops = mission.stops.map((stop) => stop.toObject ? stop.toObject() : { ...stop });
  const originalTotal = mission.montantTotal;
  const allocation = mission.partageFrais === 'gratuit' ? 0 : Math.max(0, Number(demande.montantLivreur || demande.fraisLivraison || demande.tarif || 0));
  const pickup = { type: 'pickup', ordre: mission.stops.length + 1, libelle: `Retrait ${demande.sourceType}`, utilisateur: demande.vendeur, commande: { modele: commandModel, id: commandId }, adresse: demande.adresseRecuperation, montantAlloue: 0, statut: 'en_attente' };
  const dropoff = { type: 'dropoff', ordre: mission.stops.length + 2, libelle: `Livraison ${demande.sourceType}`, utilisateur: demande.client, commande: { modele: commandModel, id: commandId }, adresse: demande.adresseLivraison, montantAlloue: allocation, statut: 'en_attente' };
  mission.stops.push(pickup, dropoff);
  validateStops(mission.stops);
  if (mission.partageFrais === 'fixe') mission.montantTotal = mission.stops.filter((stop) => stop.type === 'dropoff').reduce((sum, stop) => sum + Math.max(0, Number(stop.montantAlloue) || 0), 0);
  try {
    await recalculerAllocations(mission);
    demande.typeLivraison = 'groupée';
    demande.missionGroupee = mission._id;
    await demande.save();
    return { demande, mission };
  } catch (error) {
    mission.stops = originalStops;
    mission.montantTotal = originalTotal;
    await mission.save().catch(() => undefined);
    throw error;
  }
};

module.exports = { creerMissionGroupee, rattacherDemandeMission, recalculerAllocations, validateStops };
