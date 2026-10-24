const Verification = require('../models/Verification');
const Boutique = require('../models/Boutique');
const Restaurant = require('../models/Restaurant');
const Hotel = require('../models/Hotel');
const Livreur = require('../models/Livreur');
const AgenceLivraison = require('../models/AgenceLivraison');

const MODELES = { vente: Boutique, restauration: Restaurant, hotel: Hotel, livraison: Livreur, agence_livraison: AgenceLivraison };
const champProprietaire = type => type === 'livraison' ? 'utilisateur' : 'proprietaire';

const demander = async (req, res) => {
  try {
    const { espaceType, espaceId, preuves = [], noteDemandeur = '', typeVerification = 'standard' } = req.body || {};
    const Model = MODELES[espaceType];
    if (!Model || !espaceId) return res.status(400).json({ message: 'Espace invalide.' });
    const espace = await Model.findById(espaceId);
    if (!espace || String(espace[champProprietaire(espaceType)]) !== String(req.user._id)) return res.status(403).json({ message: 'Accès refusé.' });
    const derniere = await Verification.findOne({ espaceType, espaceId }).sort({ createdAt: -1 });
    if (derniere?.statut === 'en_attente') return res.status(409).json({ message: 'Une demande de vérification est déjà en attente.' });
    const v = await Verification.create({ demandeur: req.user._id, espaceType, espaceId, preuves: Array.isArray(preuves) ? preuves.slice(0, 20) : [], noteDemandeur: String(noteDemandeur || ''), typeVerification });
    return res.status(201).json(v);
  } catch (e) { console.error(e); return res.status(500).json({ message: 'Erreur serveur.' }); }
};

const miennes = async (req, res) => res.json(await Verification.find({ demandeur: req.user._id }).sort({ createdAt: -1 }));

const traiter = async (req, res) => {
  try {
    const { statut, motifAdmin = '' } = req.body || {};
    if (!['informations_requises', 'approuve', 'refuse', 'revoque'].includes(statut)) return res.status(400).json({ message: 'Statut de vérification invalide.' });
    const v = await Verification.findById(req.params.id);
    if (!v) return res.status(404).json({ message: 'Demande introuvable.' });
    v.statut = statut; v.motifAdmin = String(motifAdmin || ''); v.traitePar = req.user._id; v.traiteLe = new Date(); await v.save();
    return res.json(v);
  } catch (e) { console.error(e); return res.status(500).json({ message: 'Erreur serveur.' }); }
};

const listeAdmin = async (req, res) => res.json(await Verification.find({ statut: { $in: ['en_attente', 'informations_requises'] } }).sort({ createdAt: 1 }).limit(100));

module.exports = { demander, miennes, traiter, listeAdmin };
