const mongoose = require('mongoose');
const MissionLivraison = require('../models/MissionLivraison');
const Livreur = require('../models/Livreur');
const DemandeLivraison = require('../models/DemandeLivraison');
const { creerMissionGroupee, rattacherDemandeMission } = require('../utils/missionLivraison');

const create = async (req, res) => {
  let mission = null;
  const attachedDemandIds = [];
  try {
    const body = req.body || {};
    if (Array.isArray(body.demandeIds)) {
      const ids = [...new Set(body.demandeIds.map(String))];
      if (ids.length < 2 || ids.length > 15 || ids.some((id) => !mongoose.isValidObjectId(id))) return res.status(400).json({ message: 'Sélectionnez entre 2 et 15 demandes valides pour une livraison groupée.' });
      const demands = await DemandeLivraison.find({ _id: { $in: ids }, statut: 'en_attente', missionGroupee: null, $or: [{ vendeur: req.user._id }, { client: req.user._id }] }).lean();
      if (demands.length !== ids.length) return res.status(409).json({ message: 'Une ou plusieurs demandes ne sont plus disponibles, sont déjà groupées ou ne vous appartiennent pas. Actualisez la liste.' });
      const sourceKeys = demands.map((item) => String(item.sourceId || item._id));
      if (new Set(sourceKeys).size !== sourceKeys.length) return res.status(409).json({ message: 'La sélection contient plusieurs demandes liées à la même commande.' });
      const byId = new Map(demands.map((item) => [String(item._id), item]));
      const selected = ids.map((id) => byId.get(id));
      for (const item of selected) {
        if (!item.adresseRecuperation?.ville || !item.adresseRecuperation?.details || !item.adresseLivraison?.ville || !item.adresseLivraison?.details) return res.status(422).json({ message: `La demande ${String(item._id).slice(-8)} doit avoir une ville et des indications locales complètes au retrait et à la destination.` });
      }
      const sharing = body.partageFrais || 'proportionnel';
      const total = sharing === 'gratuit' ? 0 : Number(body.montantTotal);
      const allocations = body.allocations && typeof body.allocations === 'object' ? body.allocations : {};
      const stops = [
        ...selected.map((item, index) => ({ type: 'pickup', ordre: index + 1, libelle: `Retrait · ${item.sourceType}`, utilisateur: item.vendeur, commande: { modele: item.sourceModel || 'DemandeLivraison', id: item.sourceId || item._id }, adresse: item.adresseRecuperation, montantAlloue: 0 })),
        ...selected.map((item, index) => ({ type: 'dropoff', ordre: selected.length + index + 1, libelle: `Destination · ${item.sourceType}`, utilisateur: item.client, commande: { modele: item.sourceModel || 'DemandeLivraison', id: item.sourceId || item._id }, adresse: item.adresseLivraison, montantAlloue: sharing === 'gratuit' ? 0 : sharing === 'fixe' ? Number(allocations[String(item._id)] || 0) : Math.max(0, Number(item.montantLivreur || item.fraisLivraison || item.tarif || 1)) }))
      ];
      mission = await creerMissionGroupee({ createur: req.user._id, livreur: null, agence: null, stops, montantTotal: total, partageFrais: sharing });
      for (const item of selected) {
        const updated = await DemandeLivraison.findOneAndUpdate({ _id: item._id, statut: 'en_attente', missionGroupee: null, $or: [{ vendeur: req.user._id }, { client: req.user._id }] }, { $set: { typeLivraison: 'groupée', missionGroupee: mission._id } }, { new: true });
        if (!updated) throw new Error('Une demande vient d’être modifiée par un autre processus. La mission a été annulée ; actualisez les demandes.');
        attachedDemandIds.push({ id: String(item._id), originalType: item.typeLivraison || 'independante' });
      }
      return res.status(201).json(mission);
    }
    // Legacy/manual route planning remains available, but ownership and assignment fields are never accepted from the client.
    const stops = Array.isArray(body.stops) ? body.stops.map((stop) => ({ type: stop.type, libelle: stop.libelle, adresse: stop.adresse, montantAlloue: stop.montantAlloue })) : [];
    mission = await creerMissionGroupee({ createur: req.user._id, livreur: null, agence: null, stops, montantTotal: body.montantTotal, partageFrais: body.partageFrais });
    return res.status(201).json(mission);
  } catch (error) {
    if (mission) {
      for (const attached of attachedDemandIds) await DemandeLivraison.updateOne({ _id: attached.id, missionGroupee: mission._id }, { $set: { missionGroupee: null, typeLivraison: attached.originalType } }).catch(() => undefined);
      await MissionLivraison.deleteOne({ _id: mission._id }).catch(() => undefined);
    }
    return res.status(400).json({ message: error.message || 'Création de mission impossible.' });
  }
};

const rattacher = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.body.demandeId)) return res.status(400).json({ message: 'Identifiant invalide.' });
    const [mission, demande] = await Promise.all([MissionLivraison.findById(req.params.id), DemandeLivraison.findById(req.body.demandeId)]);
    if (!mission) return res.status(404).json({ message: 'Mission introuvable.' });
    if (!demande) return res.status(404).json({ message: 'Demande de livraison introuvable.' });
    if (String(mission.createur) !== String(req.user._id)) return res.status(403).json({ message: 'Seul le créateur peut modifier cette mission.' });
    if (mission.statut !== 'en_attente') return res.status(409).json({ message: 'Une mission ne peut être modifiée qu’avant la proposition au livreur.' });
    if (String(demande.vendeur) !== String(req.user._id) && String(demande.client) !== String(req.user._id)) return res.status(403).json({ message: 'Vous ne pouvez pas rattacher une demande qui ne vous appartient pas.' });
    res.json(await rattacherDemandeMission({ demandeId: req.body.demandeId, missionId: req.params.id }));
  } catch (error) { res.status(400).json({ message: error.message }); }
};

const mine = async (req, res) => {
  const missions = await MissionLivraison.find({ $or: [{ createur: req.user._id }, { livreur: req.user._id }] }).sort({ createdAt: -1 });
  res.json(missions);
};

const candidats = async (req, res) => {
  try {
    const profiles = await Livreur.find({ statut: 'active', disponibilite: 'en_ligne' }).limit(200).populate('utilisateur', 'prenom nom telephone photo statut').lean();
    const candidates = [];
    for (const profile of profiles) {
      const user = profile.utilisateur;
      if (!user || user.statut !== 'actif') continue;
      const [activeMission, activeRequest] = await Promise.all([
        MissionLivraison.exists({ livreur: user._id, statut: { $in: ['proposée', 'assignée', 'en_route'] } }),
        DemandeLivraison.exists({ livreur: user._id, statut: { $in: ['assignée', 'en_cours', 'en_route', 'arrivée'] } })
      ]);
      if (activeMission || activeRequest) continue;
      candidates.push({ utilisateurId: String(user._id), nom: `${user.prenom || ''} ${user.nom || ''}`.trim(), telephone: user.telephone || '', photo: user.photo || '', transport: profile.moyenTransport, zones: profile.zoneCouverture || [], livraisons: profile.nombreLivraisons || 0 });
    }
    res.json(candidates);
  } catch (error) { res.status(500).json({ message: 'Impossible de rechercher les livreurs disponibles.' }); }
};

const demandesRattachables = async (req, res) => {
  try {
    const demandes = await DemandeLivraison.find({ $or: [{ vendeur: req.user._id }, { client: req.user._id }], missionGroupee: null, statut: 'en_attente' }).sort({ createdAt: -1 }).limit(100).lean();
    res.json(demandes.filter((item) => item.adresseRecuperation?.ville && item.adresseRecuperation?.details && item.adresseLivraison?.ville && item.adresseLivraison?.details).map((item) => ({ _id: String(item._id), sourceType: item.sourceType, reference: item.sourceId ? String(item.sourceId).slice(-8).toUpperCase() : String(item._id).slice(-8).toUpperCase(), ville: item.adresseLivraison?.ville || '', quartier: item.adresseLivraison?.quartier || '', tarif: Number(item.montantLivreur || item.fraisLivraison || item.tarif || 0) })));
  } catch (error) { res.status(500).json({ message: 'Impossible de charger les demandes rattachables.' }); }
};

const proposer = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.body.livreurId)) return res.status(400).json({ message: 'Identifiant invalide.' });
    const mission = await MissionLivraison.findById(req.params.id);
    if (!mission) return res.status(404).json({ message: 'Mission introuvable.' });
    if (String(mission.createur) !== String(req.user._id)) return res.status(403).json({ message: 'Seul le créateur peut proposer la mission.' });
    if (mission.statut !== 'en_attente') return res.status(409).json({ message: 'Seule une mission en attente peut être proposée.' });
    const profile = await Livreur.findOne({ utilisateur: req.body.livreurId, statut: 'active', disponibilite: 'en_ligne' });
    if (!profile) return res.status(409).json({ message: 'Ce livreur n’est plus actif ou disponible.' });
    const user = await require('../models/User').findById(profile.utilisateur).select('statut').lean();
    if (!user || user.statut !== 'actif') return res.status(409).json({ message: 'Le compte de ce livreur n’est pas actif.' });
    const [activeMission, activeRequest] = await Promise.all([
      MissionLivraison.exists({ livreur: profile.utilisateur, statut: { $in: ['proposée', 'assignée', 'en_route'] } }),
      DemandeLivraison.exists({ livreur: profile.utilisateur, statut: { $in: ['assignée', 'en_cours', 'en_route', 'arrivée'] } })
    ]);
    if (activeMission || activeRequest) return res.status(409).json({ message: 'Ce livreur a déjà une mission active.' });
    mission.livreur = profile.utilisateur;
    mission.statut = 'proposée';
    await mission.save();
    res.json({ ok: true, mission, message: 'Proposition envoyée. Le livreur doit accepter avant de démarrer.' });
  } catch (error) { res.status(500).json({ message: 'Impossible de proposer cette mission.' }); }
};

const accepter = async (req, res) => {
  try {
    const mission = await MissionLivraison.findById(req.params.id);
    if (!mission) return res.status(404).json({ message: 'Mission introuvable.' });
    if (String(mission.livreur || '') !== String(req.user._id)) return res.status(403).json({ message: 'Cette proposition ne vous est pas destinée.' });
    if (mission.statut !== 'proposée') return res.status(409).json({ message: 'Cette proposition n’est plus en attente.' });
    const [activeMission, activeRequest] = await Promise.all([
      MissionLivraison.exists({ _id: { $ne: mission._id }, livreur: req.user._id, statut: { $in: ['proposée', 'assignée', 'en_route'] } }),
      DemandeLivraison.exists({ livreur: req.user._id, statut: { $in: ['assignée', 'en_cours', 'en_route', 'arrivée'] } })
    ]);
    if (activeMission || activeRequest) return res.status(409).json({ message: 'Vous avez déjà une mission active.' });
    mission.statut = 'assignée'; await mission.save();
    res.json({ ok: true, mission, message: 'Mission acceptée. Vous pouvez démarrer le parcours.' });
  } catch (error) { res.status(500).json({ message: 'Impossible d’accepter cette mission.' }); }
};

const refuser = async (req, res) => {
  try {
    const mission = await MissionLivraison.findById(req.params.id);
    if (!mission) return res.status(404).json({ message: 'Mission introuvable.' });
    if (String(mission.livreur || '') !== String(req.user._id)) return res.status(403).json({ message: 'Cette proposition ne vous est pas destinée.' });
    if (mission.statut !== 'proposée') return res.status(409).json({ message: 'Seule une proposition en attente peut être refusée.' });
    mission.livreur = null; mission.statut = 'en_attente'; await mission.save();
    res.json({ ok: true, mission, message: 'Proposition refusée. La mission redevient disponible pour un autre livreur.' });
  } catch (error) { res.status(500).json({ message: 'Impossible de refuser cette proposition.' }); }
};

const demarrer = async (req, res) => {
  try {
    const mission = await MissionLivraison.findById(req.params.id);
    if (!mission) return res.status(404).json({ message: 'Mission introuvable.' });
    if (String(mission.livreur || '') !== String(req.user._id)) return res.status(403).json({ message: 'Seul le livreur affecté peut démarrer la mission.' });
    if (mission.statut !== 'assignée') return res.status(409).json({ message: 'La mission doit être acceptée avant de démarrer.' });
    mission.statut = 'en_route'; await mission.save();
    res.json({ ok: true, mission });
  } catch (error) { res.status(500).json({ message: 'Impossible de démarrer la mission.' }); }
};

const terminerArret = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.stopId)) return res.status(400).json({ message: 'Identifiant invalide.' });
    const mission = await MissionLivraison.findById(req.params.id);
    if (!mission) return res.status(404).json({ message: 'Mission introuvable.' });
    const allowed = String(mission.livreur || '') === String(req.user._id) && mission.statut === 'en_route';
    if (!allowed) return res.status(403).json({ message: 'Seul le livreur affecté, après démarrage de la mission, peut valider les arrêts.' });
    if (['terminée', 'annulée'].includes(mission.statut)) return res.status(409).json({ message: 'Cette mission est déjà clôturée.' });
    const stop = mission.stops.id(req.params.stopId);
    if (!stop) return res.status(404).json({ message: 'Arrêt introuvable dans cette mission.' });
    if (stop.statut === 'termine') return res.status(409).json({ message: 'Cet arrêt est déjà validé.' });
    const priorStops = mission.stops.filter((item) => item.ordre < stop.ordre);
    if (priorStops.some((item) => item.statut !== 'termine')) return res.status(409).json({ message: 'Validez les arrêts précédents dans l’ordre du parcours.' });
    const { type, reference = '', note = '' } = req.body || {};
    if (!['code', 'photo', 'signature', 'note'].includes(type)) return res.status(400).json({ message: 'Type de preuve invalide.' });
    if (!String(reference).trim() && !String(note).trim()) return res.status(400).json({ message: 'Une référence de preuve ou une note est obligatoire.' });
    stop.statut = 'termine';
    stop.termineLe = new Date();
    stop.preuve = { type, reference: String(reference).trim().slice(0, 500), note: String(note).trim().slice(0, 1000), valideeLe: new Date() };
    if (mission.stops.every((item) => item.statut === 'termine')) mission.statut = 'terminée';
    else if (mission.statut === 'en_attente') mission.statut = 'assignée';
    await mission.save();
    res.json({ ok: true, mission, arret: stop });
  } catch (error) { res.status(500).json({ message: 'Impossible de valider cet arrêt.' }); }
};

module.exports = { create, rattacher, mine, candidats, demandesRattachables, proposer, accepter, refuser, demarrer, terminerArret };
