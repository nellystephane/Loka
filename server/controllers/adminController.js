const User = require('../models/User');
const Annonce = require('../models/Annonce');
const Boutique = require('../models/Boutique');
const Restaurant = require('../models/Restaurant');
const Hotel = require('../models/Hotel');
const Commande = require('../models/Commande');
const CommandeRestaurant = require('../models/CommandeRestaurant');
const CommandeAnnonce = require('../models/CommandeAnnonce');
const DemandeLivraison = require('../models/DemandeLivraison');
const Litige = require('../models/Litige');
const Ledger = require('../models/Ledger');
const Payout = require('../models/Payout');
const { creerNotification } = require('../utils/notifier');
const { creerPayoutEtReserver } = require('../utils/ledger');
const { lancerPayoutFedaPay, synchroniserPayoutFedaPay } = require('../utils/payout');
const LedgerAllocation = require('../models/LedgerAllocation');

// ─── Statistiques globales (section 11.1, priorité 7) — une seule vue
// d'ensemble, volontairement synthétique plutôt qu'un tableau de bord
// analytique complet. ───
// GET /api/admin/statistiques
const statistiques = async (req, res) => {
  try {
    const ilYA7Jours = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUtilisateurs, nouveauxUtilisateurs, totalSuspendus,
      totalAnnonces, totalBoutiques, totalRestaurants, totalHotels,
      totalCommandesVente, totalCommandesRestaurant, totalCommandesAnnonce,
      totalLivraisons, livraisonsEnCours,
      litigesOuverts,
      soldeDisponibleAgg
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: ilYA7Jours } }),
      User.countDocuments({ statut: 'suspendu' }),
      Annonce.countDocuments(),
      Boutique.countDocuments(),
      Restaurant.countDocuments(),
      Hotel.countDocuments(),
      Commande.countDocuments(),
      CommandeRestaurant.countDocuments(),
      CommandeAnnonce.countDocuments(),
      DemandeLivraison.countDocuments(),
      DemandeLivraison.countDocuments({ statut: { $in: ['assignée', 'en_cours', 'récupérée'] } }),
      Litige.countDocuments({ statut: { $in: ['ouvert', 'en_cours'] } }),
      Ledger.aggregate([
        { $match: { sens:'credit', soldeEtat: 'disponible' } },
        { $group: { _id: null, total: { $sum: '$montantNet' } } }
      ])
    ]);

    res.json({
      utilisateurs: { total: totalUtilisateurs, nouveaux7j: nouveauxUtilisateurs, suspendus: totalSuspendus },
      catalogue: { annonces: totalAnnonces, boutiques: totalBoutiques, restaurants: totalRestaurants, hotels: totalHotels },
      commandes: {
        vente: totalCommandesVente,
        restauration: totalCommandesRestaurant,
        annonce: totalCommandesAnnonce,
        total: totalCommandesVente + totalCommandesRestaurant + totalCommandesAnnonce
      },
      livraisons: { total: totalLivraisons, enCours: livraisonsEnCours },
      litigesOuverts,
      soldeDisponibleAVerser: soldeDisponibleAgg[0]?.total || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Liste paginée des utilisateurs, avec recherche et filtres ───
// GET /api/admin/utilisateurs?recherche=&statut=&role=&page=
const listerUtilisateurs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limite = 25;
    const filtre = {};
    if (req.query.statut) filtre.statut = req.query.statut;
    if (req.query.role) filtre.role = req.query.role;
    if (req.query.recherche) {
      const regex = new RegExp(req.query.recherche.trim(), 'i');
      filtre.$or = [{ nom: regex }, { prenom: regex }, { email: regex }];
    }

    const [utilisateurs, total] = await Promise.all([
      User.find(filtre).select('-motDePasse').sort({ createdAt: -1 }).skip((page - 1) * limite).limit(limite),
      User.countDocuments(filtre)
    ]);

    res.json({ utilisateurs, total, page, pages: Math.ceil(total / limite) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Suspendre un compte ───
// PUT /api/admin/utilisateurs/:id/suspendre
const suspendreUtilisateur = async (req, res) => {
  try {
    const { motif } = req.body;
    if (!motif || !motif.trim()) return res.status(400).json({ message: 'Le motif de suspension est obligatoire.' });

    const utilisateur = await User.findById(req.params.id);
    if (!utilisateur) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    if (utilisateur.role === 'admin') return res.status(403).json({ message: 'Impossible de suspendre un compte administrateur.' });

    utilisateur.statut = 'suspendu';
    utilisateur.suspension = {
      motif: motif.trim(),
      suspenduPar: req.user._id,
      dateSuspension: new Date(),
      dateReactivation: null
    };
    await utilisateur.save();

    const io = req.app.get('io');
    await creerNotification(io, utilisateur._id, 'compte_suspendu', 'Compte suspendu', motif.trim(), '/profil');

    res.json({ message: 'Compte suspendu.', utilisateur: { _id: utilisateur._id, statut: utilisateur.statut } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Réactiver un compte ───
// PUT /api/admin/utilisateurs/:id/reactiver
const reactiverUtilisateur = async (req, res) => {
  try {
    const utilisateur = await User.findById(req.params.id);
    if (!utilisateur) return res.status(404).json({ message: 'Utilisateur introuvable.' });

    utilisateur.statut = 'actif';
    utilisateur.suspension.dateReactivation = new Date();
    await utilisateur.save();

    const io = req.app.get('io');
    await creerNotification(io, utilisateur._id, 'compte_reactive', 'Compte réactivé', 'Votre compte a été réactivé.', '/profil');

    res.json({ message: 'Compte réactivé.', utilisateur: { _id: utilisateur._id, statut: utilisateur.statut } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Litiges : liste et traitement ───
// GET /api/admin/litiges?statut=
const listerLitiges = async (req, res) => {
  try {
    const filtre = {};
    if (req.query.statut) filtre.statut = req.query.statut;
    const litiges = await Litige.find(filtre)
      .populate('auteur', 'nom prenom email photo')
      .sort({ createdAt: -1 });
    res.json(litiges);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// PUT /api/admin/litiges/:id/traiter
const traiterLitige = async (req, res) => {
  try {
    const { statut, note } = req.body;
    if (!['en_cours', 'resolu', 'rejete'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }
    const litige = await Litige.findById(req.params.id);
    if (!litige) return res.status(404).json({ message: 'Signalement introuvable.' });

    litige.statut = statut;
    litige.traitement = { admin: req.user._id, note: (note || '').trim(), date: new Date() };
    await litige.save();

    if (statut !== 'en_cours') {
      const io = req.app.get('io');
      await creerNotification(
        io, litige.auteur, 'litige_traite', 'Votre signalement a été traité',
        statut === 'resolu' ? 'Votre signalement a été résolu.' : 'Votre signalement a été rejeté.', '/signaler'
      );
    }

    res.json(litige);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Soldes disponibles à verser, groupés par bénéficiaire (section 8.4 :
// argent disponible ≠ argent versé). Ne modifie rien — simple lecture
// agrégée du ledger. ───
// GET /api/admin/payouts
const listerSoldesAVerser = async (req, res) => {
  try {
    const alloues = await LedgerAllocation.distinct('ledger');
    const soldes = await Ledger.aggregate([
      { $match: { _id: { $nin: alloues }, sens:'credit', $or:[{soldeEtat:'disponible'},{soldeEtat:'en_attente',dateDisponibleA:{$lte:new Date()}}] } },
      { $group: { _id: '$beneficiaire', montant: { $sum: '$montantNet' }, nbEntrees: { $sum: 1 } } },
      { $match: { montant: { $gt: 0 } } },
      { $sort: { montant: -1 } }
    ]);
    const beneficiaires = await User.find({ _id: { $in: soldes.map((s) => s._id) } }).select('nom prenom email telephone');
    const parId = Object.fromEntries(beneficiaires.map((b) => [b._id.toString(), b]));

    res.json(soldes.map((s) => ({
      beneficiaire: parId[s._id.toString()] || { _id: s._id },
      montant: s.montant,
      nbEntrees: s.nbEntrees
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Déclarer un versement effectué : fait passer chaque entrée
// "disponible" du bénéficiaire à "versé" (sauvegarde document par document,
// jamais une mise à jour de masse — cohérent avec la garde d'immuabilité du
// modèle Ledger) et conserve la trace du lot dans Payout. ───
// POST /api/admin/payouts
const creerPayout = async (req, res) => {
  try {
    const { beneficiaireId, reference } = req.body;
    if (!beneficiaireId) return res.status(400).json({ message: 'Bénéficiaire obligatoire.' });
    const payout = await creerPayoutEtReserver({ beneficiaire: beneficiaireId, executePar: req.user._id, reference: (reference || '').trim() });
    if (!payout) return res.status(409).json({ message: 'Aucun solde disponible à verser pour cet utilisateur.' });
    // La création du payout réserve les écritures. Le virement FedaPay réel
    // pourra ensuite faire passer ce lot à 'réussi' avec sa référence fournisseur.
    payout.statut = 'en_attente';
    await payout.save();
    const io = req.app.get('io');
    await creerNotification(io, beneficiaireId, 'payout_verse', 'Versement préparé', `${payout.montant.toLocaleString('fr-FR')} XOF sont réservés pour ce payout.`, '/abonnements');
    res.status(201).json(payout);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const traiterPayout = async (req,res) => {
  try {
    const { statut, referenceFournisseur, erreur } = req.body || {};
    const payout=await Payout.findById(req.params.id); if(!payout)return res.status(404).json({message:'Payout introuvable.'});
    if(statut==='en_cours') return res.json(await lancerPayoutFedaPay(payout._id,req.user._id));
    if(statut==='synchroniser') return res.json(await synchroniserPayoutFedaPay(payout._id));
    if(!['échoué','annulé'].includes(statut))return res.status(400).json({message:'Statut de traitement invalide.'});
    if(payout.statut==='réussi')return res.status(409).json({message:'Ce payout est déjà finalisé.'});
    payout.statut=statut;payout.referenceFournisseur=(referenceFournisseur||'').trim();payout.erreur=(erreur||'').trim();payout.traiteLe=new Date();await payout.save();
    if(statut==='annulé')await LedgerAllocation.deleteMany({payout:payout._id});
    res.json(payout);
  }catch(e){console.error(e);res.status(400).json({message:e.message||'Impossible de traiter le payout.'});}
};

module.exports = {
  statistiques, listerUtilisateurs, suspendreUtilisateur, reactiverUtilisateur,
  listerLitiges, traiterLitige, listerSoldesAVerser, creerPayout, traiterPayout
};
