const Paiement = require('../models/Paiement');
const { creerNotification } = require('../utils/notifier');
const Annonce = require('../models/Annonce');
const Boutique = require('../models/Boutique');
const Restaurant = require('../models/Restaurant');
const Hotel = require('../models/Hotel');
const Livreur = require('../models/Livreur');
const AgenceLivraison = require('../models/AgenceLivraison');
const PresenceProfessionnelle = require('../models/PresenceProfessionnelle');
const { AVANTAGES_GRATUIT } = require('../utils/abonnement');
const { prioriteDuPlan } = require('../utils/abonnementPro');
const { creerCheckoutFedaPay } = require('../utils/fedapayClient');
const { prioriteDuPlan: prioritePlan } = require('../utils/abonnementPro');
const { GRILLE_PRO, prixPlan } = require('../utils/tarificationPro');

// ─── Modèles des espaces métiers, par type ───
const MODELES_ESPACE = {
  vente: Boutique,
  restauration: Restaurant,
  hotel: Hotel,
  livraison: Livreur,
  livraison_individuel: Livreur,
  agence_livraison: AgenceLivraison,
  presence: PresenceProfessionnelle
};

// ─── Abonnement "Pro" des espaces métiers (Vente/Restauration/Hôtel/Livraison) ───
// Distinct de l'abonnement annonces classique. Grille à 3 paliers, identique
// pour tous les types d'espaces, pour rester simple :
//   - starter ("Présence pro") : visibilité de base dans l'annuaire public
//   - pro : + mise en avant illimitée des produits/plats/chambres
//   - business : + priorité d'affichage dans les recherches et l'annuaire
const PRIX_PRO = {
  ...GRILLE_PRO.vente,
  starter_mensuel: GRILLE_PRO.vente.starter.mensuel,
  starter_annuel: GRILLE_PRO.vente.starter.annuel,
  pro_mensuel: GRILLE_PRO.vente.pro.mensuel,
  pro_annuel: GRILLE_PRO.vente.pro.annuel,
  business_mensuel: GRILLE_PRO.vente.business.mensuel,
  business_annuel: GRILLE_PRO.vente.business.annuel
};

// ─── Avantages selon le type d'abonnement ───
const AVANTAGES_PRO_PAR_PALIER = {
  starter: { label:'Starter', sousTitre:'Présence professionnelle', description:'Vitrine publique et présence professionnelle.', avantages:['vitrine publique','catalogue de base','contact client'] },
  pro: { label:'Pro', sousTitre:'Vendre et développer', description:'Plus de mise en avant et de personnalisation.', avantages:['avantages Starter','mise en avant','bibliothèque de templates Pro'] },
  business: { label:'Business', sousTitre:'Gérer professionnellement', description:'Personnalisation avancée et modules métier premium.', avantages:['avantages Pro','templates Business','personnalisation avancée','réservation restaurant si applicable'] },
  presence: { label:'Présence', sousTitre:'Être trouvé localement', description:'Une présence professionnelle publique simple.', avantages:['vitrine publique','coordonnées','localisation'] }
};

const AVANTAGES = {
  abonnement_30j: {
    nombreAnnonces: 5,
    videoAutorisee: true,
    miseEnAvant: false,
    dureeAnnonce: 30
  },
  abonnement_90j: {
    nombreAnnonces: 10,
    videoAutorisee: true,
    miseEnAvant: false,
    dureeAnnonce: 90
  },
  abonnement_annuel: {
    nombreAnnonces: 999999, // "illimité" en pratique (JSON ne supporte pas Infinity)
    videoAutorisee: true,
    miseEnAvant: true,
    dureeAnnonce: 360
  }
};

// ─── Prix des abonnements (cf. cahier des charges) ───
const PRIX = {
  abonnement_30j: 4900,     // 4 900 XOF
  abonnement_90j: 8500,     // 8 500 XOF
  abonnement_annuel: 32000  // 32 000 XOF (très avantageux vs. 4900 × 12)
};

// ─── Liste des offres disponibles ───
// GET /api/paiements/offres
const getOffres = async (req, res) => {
  res.json([
    { type: 'gratuit', label: 'Gratuit', prix: 0, duree: 'Illimitée', avantages: AVANTAGES_GRATUIT },
    { type: 'abonnement_30j', label: '30 jours', prix: PRIX.abonnement_30j, duree: '30 jours', avantages: AVANTAGES.abonnement_30j },
    { type: 'abonnement_90j', label: '90 jours', prix: PRIX.abonnement_90j, duree: '90 jours', avantages: AVANTAGES.abonnement_90j },
    { type: 'abonnement_annuel', label: 'Annuel', prix: PRIX.abonnement_annuel, duree: '360 jours', avantages: AVANTAGES.abonnement_annuel }
  ]);
};

// ─── Grille tarifaire Pro disponible (identique pour tous les espaces) ───
// GET /api/paiements/offres-pro
// Renvoie 3 paliers (Starter/Pro/Business), chacun avec son prix mensuel et
// annuel, pour affichage en grille comparative côté client.
const getOffresPro = async (req, res) => {
  const espaceType = req.query.espaceType || 'vente';
  const grille = GRILLE_PRO[espaceType];
  if (!grille) return res.status(400).json({ message: 'Type d’espace invalide.' });

  res.json(Object.entries(AVANTAGES_PRO_PAR_PALIER)
    .filter(([palier]) => Object.prototype.hasOwnProperty.call(grille, palier))
    .map(([palier, infos]) => ({
      palier,
      label: infos.label,
      sousTitre: infos.sousTitre,
      description: infos.description,
      avantages: infos.avantages,
      prixMensuel: prixPlan(espaceType, palier, 'mensuel'),
      prixAnnuel: prixPlan(espaceType, palier, 'annuel')
    })));
};

// ─── Initier un paiement Pro pour un espace métier ───
// POST /api/paiements/pro
const createPaiementPro = async (req, res) => {
  try {
    const { type, espaceType, espaceId, methode, operateur, numeroTransaction } = req.body;

    if (!type || !espaceType || !methode) {
      return res.status(400).json({ message: 'Type d\'abonnement, espace et méthode de paiement sont obligatoires.' });
    }
    const match = String(type).match(/^(starter|pro|business|presence)_(mensuel|annuel)$/);
    const palierDemande = match?.[1];
    if (!match || !prixPlan(espaceType, palierDemande, match[2])) {
      return res.status(400).json({ message: 'Type d\'abonnement Pro invalide pour cet espace.' });
    }
    const Modele = MODELES_ESPACE[espaceType];
    if (!Modele) {
      return res.status(400).json({ message: "Espace métier invalide." });
    }

    // Le champ propriétaire varie selon l'espace (proprietaire pour Boutique/Restaurant/Hotel, utilisateur pour Livreur)
    const champProprietaire = ['livraison', 'livraison_individuel'].includes(espaceType) ? 'utilisateur' : 'proprietaire';
    const filtreProprietaire = { [champProprietaire]: req.user._id };
    // Si le frontend a choisi un espace précis, vérifier sa propriété au lieu de prendre arbitrairement le premier espace du type.
    const espace = espaceId
      ? await Modele.findOne({ _id: espaceId, ...filtreProprietaire })
      : await Modele.findOne(filtreProprietaire);
    if (!espace) {
      return res.status(404).json({ message: "Vous n'avez pas encore activé cet espace." });
    }

    const montant = prixPlan(espaceType, match[1], match[2]);
    const dateDebut = espace.abonnementPro?.actif && espace.abonnementPro.dateFin && new Date(espace.abonnementPro.dateFin) > new Date() ? new Date(espace.abonnementPro.dateFin) : new Date();
    const dateFin = new Date(dateDebut);
    if (type.endsWith('_mensuel')) dateFin.setDate(dateFin.getDate() + 30);
    else dateFin.setFullYear(dateFin.getFullYear() + 1);

    const paiement = await Paiement.create({
      utilisateur: req.user._id, type, espaceType, espaceId: espace._id, montant,
      methode: ['mobile_money','carte','virement'].includes(methode) ? methode : 'carte',
      operateur: operateur || null, numeroTransaction: null, dateDebut, dateFin
    });
    try {
      const checkout = await creerCheckoutFedaPay({ montant, description: `Loka — abonnement ${type}`, client: { firstname:req.user.prenom, lastname:req.user.nom, email:req.user.email, ...(req.user.telephone ? {phone_number:{number:req.user.telephone,country:'bj'}} : {}) } });
      paiement.referenceFedaPay = checkout.referenceFedaPay;
      paiement.lienPaiement = checkout.lienPaiement;
      await paiement.save();
    } catch (fedapayError) {
      await Paiement.findByIdAndDelete(paiement._id);
      throw fedapayError;
    }
    res.status(201).json(paiement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Statut de l'abonnement Pro d'un espace précis ───
// GET /api/paiements/statut-pro?espaceType=&espaceId=
const getStatutPro = async (req, res) => {
  try {
    const { espaceType, espaceId } = req.query;
    const Modele = MODELES_ESPACE[espaceType];
    if (!Modele || !espaceId) {
      return res.status(400).json({ message: 'Espace métier invalide.' });
    }

    const espace = await Modele.findById(espaceId);
    if (!espace) return res.status(404).json({ message: 'Espace introuvable.' });
    const champProprietaire = ['livraison', 'livraison_individuel'].includes(espaceType) ? 'utilisateur' : 'proprietaire';
    if (!espace[champProprietaire] || espace[champProprietaire].toString() !== req.user._id.toString()) return res.status(403).json({message:'Accès refusé.'});

    // L'abonnement peut avoir expiré depuis la dernière vérification
    if (espace.abonnementPro?.actif && espace.abonnementPro.dateFin && new Date(espace.abonnementPro.dateFin) < new Date()) {
      espace.abonnementPro.actif = false;
      espace.abonnementPro.priorite = 0;
      await espace.save();
    }

    res.json(espace.abonnementPro || { actif: false, plan: null, dateFin: null, priorite: 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Active l'abonnement Pro de l'espace lié à un paiement confirmé ───
const activerAbonnementPro = async (paiement) => {
  const Modele = MODELES_ESPACE[paiement.espaceType];
  if (!Modele) return;
  const priorite = paiement.espaceType === 'presence' ? 1 : prioriteDuPlan({ actif: true, plan: paiement.type });
  await Modele.findByIdAndUpdate(paiement.espaceId, { $set:{ abonnementPro: { actif: true, plan: paiement.type, dateFin: paiement.dateFin, priorite } } });
};

// ─── Créer un paiement (initier un abonnement) ───
// POST /api/paiements
const createPaiement = async (req, res) => {
  try {
    const { type, methode, operateur, numeroTransaction } = req.body;

    if (!type || !methode) {
      return res.status(400).json({ message: 'Type d\'abonnement et méthode de paiement sont obligatoires.' });
    }

    if (!['abonnement_30j', 'abonnement_90j', 'abonnement_annuel'].includes(type)) {
      return res.status(400).json({ message: 'Type d\'abonnement invalide.' });
    }

    const montant = PRIX[type];
    const avantages = AVANTAGES[type];

    // Calculer les dates
    const dateDebut = new Date();
    const dateFin = new Date();

    switch (type) {
      case 'abonnement_30j':
        dateFin.setDate(dateFin.getDate() + 30);
        break;
      case 'abonnement_90j':
        dateFin.setDate(dateFin.getDate() + 90);
        break;
      case 'abonnement_annuel':
        dateFin.setFullYear(dateFin.getFullYear() + 1);
        break;
    }

    const paiement = await Paiement.create({
      utilisateur: req.user._id, type, avantages, montant,
      methode: ['mobile_money','carte','virement'].includes(methode) ? methode : 'carte',
      operateur: operateur || null, numeroTransaction: null, dateDebut, dateFin
    });
    try {
      const checkout = await creerCheckoutFedaPay({ montant, description: `Loka — abonnement ${type}`, client: { firstname:req.user.prenom, lastname:req.user.nom, email:req.user.email, ...(req.user.telephone ? {phone_number:{number:req.user.telephone,country:'bj'}} : {}) } });
      paiement.referenceFedaPay = checkout.referenceFedaPay;
      paiement.lienPaiement = checkout.lienPaiement;
      await paiement.save();
    } catch (fedapayError) {
      await Paiement.findByIdAndDelete(paiement._id);
      throw fedapayError;
    }

    // Mettre à jour les annonces existantes avec les nouveaux avantages
    if (avantages.miseEnAvant) {
      await Annonce.updateMany(
        { createur: req.user._id, statut: 'actif' },
        { estMiseEnAvant: true }
      );
    }

    await Annonce.updateMany(
      { createur: req.user._id, statut: 'actif' },
      { estPremium: true }
    );

    res.status(201).json(paiement);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Vérifier le statut de l'abonnement ───
// GET /api/paiements/statut
const getStatutAbonnement = async (req, res) => {
  try {
    // Trouver le paiement actif le plus récent
    const paiementActif = await Paiement.findOne({
      utilisateur: req.user._id,
      statut: 'confirmé',
      dateFin: { $gt: new Date() }
    }).sort({ dateFin: -1 });

    if (!paiementActif) {
      return res.json({
        estAbonne: false,
        avantages: AVANTAGES_GRATUIT
      });
    }

    res.json({
      estAbonne: true,
      type: paiementActif.type,
      avantages: paiementActif.avantages,
      dateDebut: paiementActif.dateDebut,
      dateFin: paiementActif.dateFin,
      joursRestants: Math.ceil((new Date(paiementActif.dateFin) - new Date()) / (1000 * 60 * 60 * 24))
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Historique des paiements ───
// GET /api/paiements/historique
const getHistorique = async (req, res) => {
  try {
    const paiements = await Paiement.find({ utilisateur: req.user._id })
      .sort({ createdAt: -1 });

    res.json(paiements);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Confirmer un paiement (webhook opérateur Mobile Money) ───
// PUT /api/paiements/:id/confirmer
// ⚠️ Cette route est destinée au webhook du fournisseur Mobile Money, pas à
// un utilisateur final : elle est protégée par une clé secrète partagée
// (WEBHOOK_SECRET) en plus de l'authentification, pour éviter qu'un membre
// puisse confirmer un paiement (le sien ou celui d'un tiers) sans paiement réel.
const confirmerPaiement = async (req, res) => {
  try {
    const secretAttendu = process.env.WEBHOOK_SECRET;
    if (!secretAttendu || req.headers['x-webhook-secret'] !== secretAttendu) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const paiement = await Paiement.findById(req.params.id);

    if (!paiement) {
      return res.status(404).json({ message: 'Paiement non trouvé.' });
    }

    paiement.statut = 'confirmé';
    await paiement.save();

    if (paiement.espaceType) {
      await activerAbonnementPro(paiement);
      await creerNotification(
        req.app.get('io'),
        paiement.utilisateur,
        'paiement_confirme',
        'Abonnement Pro activé',
        'Votre paiement a été confirmé et votre abonnement Pro est actif.',
        '/mon-espace'
      );
      return res.json({ message: 'Paiement confirmé.', paiement });
    }

    // Appliquer les avantages aux annonces
    if (paiement.avantages.miseEnAvant) {
      await Annonce.updateMany(
        { createur: paiement.utilisateur, statut: 'actif' },
        { estMiseEnAvant: true }
      );
    }

    await Annonce.updateMany(
      { createur: paiement.utilisateur, statut: 'actif' },
      { estPremium: true }
    );

    await creerNotification(
      req.app.get('io'),
      paiement.utilisateur,
      'paiement_confirme',
      'Abonnement activé',
      'Votre paiement a été confirmé et votre abonnement est actif.',
      '/abonnements'
    );

    res.json({ message: 'Paiement confirmé.', paiement });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Confirmation en mode démonstration ───
// PUT /api/paiements/:id/simuler
// ⚠️ Provisoire : en attendant l'intégration réelle des webhooks Mobile Money
// (Orange, MTN, Moov, Wave, Celtiis), cette route permet à l'utilisateur de
// confirmer lui-même son paiement afin de tester le parcours d'abonnement.
// À retirer/sécuriser dès qu'un vrai fournisseur de paiement est branché :
// la confirmation devra alors provenir uniquement du webhook de l'opérateur.
const simulerConfirmation = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' || process.env.ALLOW_PAYMENT_SIMULATION !== 'true') return res.status(404).json({message:'Simulation de paiement désactivée.'});
    const paiement = await Paiement.findById(req.params.id);

    if (!paiement) {
      return res.status(404).json({ message: 'Paiement non trouvé.' });
    }

    if (paiement.utilisateur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Ce paiement ne vous appartient pas.' });
    }

    if (paiement.statut === 'confirmé') {
      return res.json({ message: 'Ce paiement est déjà confirmé.', paiement });
    }

    paiement.statut = 'confirmé';
    await paiement.save();

    if (paiement.espaceType) {
      await activerAbonnementPro(paiement);
      await creerNotification(
        req.app.get('io'),
        paiement.utilisateur,
        'paiement_confirme',
        'Abonnement Pro activé',
        'Votre paiement a été confirmé et votre abonnement Pro est actif.',
        '/mon-espace'
      );
      return res.json({ message: 'Paiement confirmé avec succès.', paiement });
    }

    if (paiement.avantages.miseEnAvant) {
      await Annonce.updateMany(
        { createur: paiement.utilisateur, statut: 'actif' },
        { estMiseEnAvant: true }
      );
    }

    await Annonce.updateMany(
      { createur: paiement.utilisateur, statut: 'actif' },
      { estPremium: true }
    );

    await creerNotification(
      req.app.get('io'),
      paiement.utilisateur,
      'paiement_confirme',
      'Abonnement activé',
      'Votre paiement a été confirmé et votre abonnement est actif.',
      '/abonnements'
    );

    res.json({ message: 'Paiement confirmé avec succès.', paiement });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Détail d'un paiement (pour le suivi du statut côté client) ───
// GET /api/paiements/:id
const getPaiementById = async (req, res) => {
  try {
    const paiement = await Paiement.findById(req.params.id);

    if (!paiement) {
      return res.status(404).json({ message: 'Paiement non trouvé.' });
    }

    if (paiement.utilisateur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Ce paiement ne vous appartient pas.' });
    }

    res.json(paiement);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  activerAbonnementPro,
  createPaiement,
  getStatutAbonnement,
  getHistorique,
  getPaiementById,
  confirmerPaiement,
  simulerConfirmation,
  getOffres,
  getOffresPro,
  createPaiementPro,
  getStatutPro,
  PRIX,
  AVANTAGES,
  PRIX_PRO,
  AVANTAGES_PRO_PAR_PALIER
};