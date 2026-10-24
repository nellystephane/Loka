const DemandeLivraison = require('../models/DemandeLivraison');
const Commande = require('../models/Commande');
const CommandeRestaurant = require('../models/CommandeRestaurant');
const Livreur = require('../models/Livreur');
const EvaluationLivreur = require('../models/EvaluationLivreur');
const { creerNotification } = require('../utils/notifier');
const { estimerTarif } = require('../utils/calculLivraison');
const { creerEntree } = require('../utils/ledger');
const TransactionPaiement = require('../models/TransactionPaiement');
const AgenceLivraison = require('../models/AgenceLivraison');

// ─── Créer une demande de livraison à partir d'une commande (vente ou restauration) ───
// POST /api/demandes-livraison
const createDemande = async (req, res) => {
  try {
    const { sourceType, sourceId, adresseRecuperation, tarif } = req.body;

    if (!['vente', 'restauration'].includes(sourceType) || !sourceId) {
      return res.status(400).json({ message: 'Type de commande et identifiant sont obligatoires.' });
    }

    const Model = sourceType === 'vente' ? Commande : CommandeRestaurant;
    const sourceModel = sourceType === 'vente' ? 'Commande' : 'CommandeRestaurant';
    const commande = await Model.findById(sourceId);

    if (!commande) return res.status(404).json({ message: 'Commande introuvable.' });
    if (commande.vendeur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Seul le vendeur de cette commande peut demander une livraison.' });
    }

    const existante = await DemandeLivraison.findOne({ sourceType, sourceId });
    if (existante) {
      return res.status(409).json({ message: 'Une demande de livraison existe déjà pour cette commande.' });
    }

    const demande = await DemandeLivraison.create({
      sourceType,
      sourceId,
      sourceModel,
      vendeur: commande.vendeur,
      client: commande.client,
      adresseRecuperation: adresseRecuperation || {},
      adresseLivraison: commande.adresseLivraison || {},
      tarif: tarif || 0,
      montantClient: tarif || 0,
      montantLivreur: tarif || 0,
      paiementStatut: 'a_la_livraison',
      codeRecuperation: String(Math.floor(100000 + Math.random()*900000)),
      codeLivraison: String(Math.floor(100000 + Math.random()*900000)),
      historiqueStatuts: [{ statut:'en_attente', par:req.user._id, note:'Demande créée.' }]
    });

    // ─── Prévient les livreurs déjà en ligne dont la zone couverte
    // correspond à la ville de livraison — sans casser le fonctionnement
    // existant (les livreurs continuent aussi de voir la demande en
    // consultant l'onglet "Demandes" à tout moment). Best-effort : un souci
    // de notification ne doit jamais faire échouer la création de la demande. ───
    try {
      const ville = demande.adresseLivraison?.ville;
      if (ville) {
        const livreursEnZone = await Livreur.find({
          statut: 'active',
          disponibilite: 'en_ligne',
          zoneCouverture: new RegExp(ville, 'i')
        }).select('utilisateur');

        const io = req.app.get('io');
        for (const l of livreursEnZone) {
          await creerNotification(
            io,
            l.utilisateur,
            'nouvelle_livraison',
            'Nouvelle livraison disponible',
            `Une livraison est disponible à ${ville}.`,
            '/livraison'
          );
        }
      }
    } catch (notifError) {
      console.error('Notification livreurs zone échouée :', notifError.message);
    }

    res.status(201).json(demande);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Demandes disponibles pour les livreurs (non assignées) ───
// GET /api/demandes-livraison/disponibles?ville=
const getDemandesDisponibles = async (req, res) => {
  try {
    const { ville } = req.query;
    const filtre = { statut: 'en_attente' };
    if (ville) filtre['adresseLivraison.ville'] = new RegExp(ville, 'i');

    const demandes = await DemandeLivraison.find(filtre)
      .populate('vendeur', 'nom prenom telephone')
      .sort({ createdAt: -1 });

    res.json(demandes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Accepter une demande (le livreur s'assigne lui-même) ───
// PUT /api/demandes-livraison/:id/accepter
const accepterDemande = async (req, res) => {
  try {
    const demande = await DemandeLivraison.findOneAndUpdate(
      { _id:req.params.id, statut:'en_attente', livreur:null },
      { $set:{livreur:req.user._id,statut:'assignée',origineAffectation:'livreur'}, $push:{historiqueStatuts:{statut:'assignée',par:req.user._id,note:'Livreur assigné.'}} },
      { new:true }
    );
    if (!demande) return res.status(409).json({ message: 'Cette demande a déjà été prise en charge.' });

    await creerNotification(
      req.app.get('io'),
      demande.vendeur,
      'demande_livraison_acceptee',
      'Livreur trouvé',
      `${req.user.prenom} ${req.user.nom} a accepté votre demande de livraison.`,
      '/vente'
    );

    res.json(demande);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Mettre à jour le statut (livreur assigné uniquement) ───
// PUT /api/demandes-livraison/:id/statut
const updateStatutDemande = async (req, res) => {
  try {
    const { statut } = req.body;
    const statutsValides = ['en_cours', 'en_route', 'arrivée', 'annulée'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    const demande = await DemandeLivraison.findById(req.params.id);
    if (!demande) return res.status(404).json({ message: 'Demande introuvable.' });
    if (!demande.livreur || demande.livreur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Seul le livreur assigné peut mettre à jour cette demande.' });
    }

    const transitions = {
      assignée: ['en_cours', 'annulée'],
      en_cours: ['en_route', 'annulée'],
      en_route: ['arrivée', 'annulée'],
      arrivée: ['annulée'],
    };
    if (!transitions[demande.statut]?.includes(statut)) {
      return res.status(409).json({ message: `Transition ${demande.statut} → ${statut} interdite.` });
    }
    demande.statut = statut;
    demande.historiqueStatuts.push({ statut, par: req.user._id, note: 'Statut de livraison mis à jour.' });
    await demande.save();

    const MESSAGES_STATUT = {
      en_cours: 'Votre livreur a démarré la course.',
      en_route: 'Votre livreur est en route.',
      arrivée: 'Votre livreur est arrivé.',
      livrée: 'Votre commande a été livrée.'
    };
    if (MESSAGES_STATUT[statut]) {
      await creerNotification(
        req.app.get('io'),
        demande.client,
        'statut_livraison',
        statut === 'livrée' ? 'Livraison terminée' : 'Livraison en cours',
        MESSAGES_STATUT[statut],
        '/profil'
      );
    }
    // ─── Une fois livrée, on invite le client à évaluer le livreur ───
    if (statut === 'livrée') {
      await creerNotification(
        req.app.get('io'),
        demande.client,
        'demande_evaluation',
        'Comment s\'est passée votre livraison ?',
        'Notez votre livreur en quelques secondes.',
        `/livraison/${demande._id}/evaluer`
      );
    }

    res.json(demande);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Historique des livraisons du livreur connecté ───
// GET /api/demandes-livraison/mes-livraisons
const getMesLivraisons = async (req, res) => {
  try {
    const demandes = await DemandeLivraison.find({ livreur: req.user._id })
      .populate('vendeur', 'nom prenom telephone')
      .sort({ createdAt: -1 });

    // ─── Rattache l'évaluation du client à chaque livraison, quand elle
    // existe déjà (visible directement dans l'historique du livreur, pas
    // seulement agrégée dans sa note moyenne). ───
    const evaluations = await EvaluationLivreur.find({ livraison: { $in: demandes.map((d) => d._id) } })
      .select('livraison note commentaire createdAt');
    const evaluationParLivraison = new Map(evaluations.map((e) => [e.livraison.toString(), e]));

    const demandesAvecEvaluation = demandes.map((d) => ({
      ...d.toObject(),
      evaluation: evaluationParLivraison.get(d._id.toString()) || null
    }));

    res.json(demandesAvecEvaluation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};


const getDemandeById = async (req,res) => {
  try {
    const demande = await DemandeLivraison.findById(req.params.id)
      .populate('vendeur','nom prenom telephone')
      .populate('client','nom prenom telephone')
      .populate('livreur','nom prenom telephone');
    if(!demande) return res.status(404).json({message:'Livraison introuvable.'});
    const user=String(req.user._id);
    const visible=[demande.client,demande.vendeur,demande.livreur].filter(Boolean).some(x=>String(x._id||x)===user);
    if(!visible) return res.status(403).json({message:'Accès refusé.'});
    res.json(demande);
  }catch(e){res.status(500).json({message:'Impossible de charger la livraison.'});}
};

// ─── Demandes créées par le vendeur connecté ───
// GET /api/demandes-livraison/mes-demandes
const getMesDemandes = async (req, res) => {
  try {
    const demandes = await DemandeLivraison.find({ vendeur: req.user._id })
      .populate('livreur', 'nom prenom telephone')
      .sort({ createdAt: -1 });
    res.json(demandes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/demandes-livraison/estimer
const estimerLivraison = async (req,res) => {
  try {
    const { livreurId, agenceId, origine, destination } = req.body || {};
    const estimation = await estimerTarif({livreurId, agenceId, origine, destination});
    res.json(estimation);
  } catch(e){ res.status(400).json({message:e.message || 'Impossible de calculer le tarif.'}); }
};

// PUT /api/demandes-livraison/:id/recuperation
const validerRecuperation = async (req,res) => {
  try {
    const demande=await DemandeLivraison.findById(req.params.id);
    if(!demande) return res.status(404).json({message:'Demande introuvable.'});
    const code=String(req.body?.code || '').trim();
    if(!code || !demande.codeRecuperation || code !== demande.codeRecuperation) return res.status(409).json({message:'Code de récupération invalide.'});
    if(!demande.livreur || demande.livreur.toString()!==req.user._id.toString()) return res.status(403).json({message:'Seul le livreur assigné peut valider la récupération.'});
    demande.recuperationValideeLe=new Date();
    demande.statut='en_route';
    demande.historiqueStatuts.push({statut:'en_route',par:req.user._id,note:'Récupération validée.'});
    await demande.save();
    await creerNotification(req.app.get('io'),demande.client,'statut_livraison','Commande récupérée','Votre livraison est maintenant en route.','/profil');
    res.json(demande);
  }catch(e){console.error(e);res.status(500).json({message:'Erreur serveur.'});}
};

// PUT /api/demandes-livraison/:id/livraison
const validerLivraison = async (req,res) => {
  try {
    const demande=await DemandeLivraison.findById(req.params.id);
    if(!demande) return res.status(404).json({message:'Demande introuvable.'});
    const code=String(req.body?.code || '').trim();
    if(!code || !demande.codeLivraison || code !== demande.codeLivraison) return res.status(409).json({message:'Code de remise invalide.'});
    if(!demande.livreur || demande.livreur.toString()!==req.user._id.toString()) return res.status(403).json({message:'Seul le livreur assigné peut valider la remise.'});
    if (!['en_route', 'arrivée'].includes(demande.statut)) {
      return res.status(409).json({ message: 'La livraison doit être en route ou arrivée avant la remise.' });
    }
    if (demande.paiementTransaction && Number(demande.montantLivreur) > 0) {
      const transaction = await TransactionPaiement.findById(demande.paiementTransaction);
      if (transaction && transaction.statut === 'approuvé') {
        let beneficiaireId = demande.livreur || null;
        if (!beneficiaireId && demande.agence) {
          const agence = await AgenceLivraison.findById(demande.agence).select('proprietaire');
          beneficiaireId = agence?.proprietaire || null;
        }
        if (beneficiaireId) {
          await creerEntree({
            transactionPaiement: transaction._id,
            commande: { modele: demande.sourceModel || 'DemandeLivraison', id: demande.sourceId || demande._id },
            beneficiaire: beneficiaireId,
            montantBrut: Number(demande.montantLivreur),
            montantNet: Number(demande.montantLivreur),
            fraisPaiement: 0,
            type: 'vente',
            idempotencyKey: `livraison_${demande._id}_${beneficiaireId}`,
            note: `Rémunération de livraison ${demande._id}`
          });
        }
      }
    }
    demande.livraisonValideeLe=new Date(); demande.statut='livrée'; demande.preuveLivraison=req.body?.preuve || null;
    demande.historiqueStatuts.push({statut:'livrée',par:req.user._id,note:'Remise validée par code.'});
    await demande.save();
    await creerNotification(req.app.get('io'),demande.client,'livraison_terminee','Livraison terminée','La remise de votre commande a été validée.','/profil');
    res.json(demande);
  }catch(e){console.error(e);res.status(500).json({message:'Erreur serveur.'});}
};

// PUT /api/demandes-livraison/:id/assigner
// Permet au vendeur/restaurant de choisir son livreur interne ou une agence,
// sans passer par le marché des demandes publiques.
const assignerLivraison = async (req,res) => {
  try {
    const { livreurId, agenceId, type='independante' } = req.body || {};
    const demande=await DemandeLivraison.findById(req.params.id); if(!demande) return res.status(404).json({message:'Demande introuvable.'});
    if(demande.vendeur.toString()!==req.user._id.toString()) return res.status(403).json({message:'Seul le professionnel à l’origine de la commande peut assigner la livraison.'});
    const Livreur=require('../models/Livreur'); const Agence=require('../models/AgenceLivraison');
    if(livreurId){ const filtreLivreur={utilisateur:livreurId,statut:'active'}; if(type==='interne') filtreLivreur.employeur=req.user._id; const l=await Livreur.findOne(filtreLivreur); if(!l) return res.status(404).json({message:'Livreur introuvable.'}); demande.livreur=l.utilisateur; demande.agence=null; demande.typeLivraison=type==='interne'?'interne':'independante'; demande.origineAffectation=type==='interne'?'interne':'vendeur'; }
    else if(agenceId){ const a=await Agence.findOne({_id:agenceId,statut:'active'}); if(!a) return res.status(404).json({message:'Agence introuvable.'}); demande.agence=a._id; demande.livreur=null; demande.typeLivraison='agence'; demande.origineAffectation='agence'; }
    else return res.status(400).json({message:'Livreur ou agence obligatoire.'});
    demande.statut='assignée'; demande.historiqueStatuts.push({statut:'assignée',par:req.user._id,note:'Livraison assignée par le professionnel.'}); await demande.save();
    await creerNotification(req.app.get('io'),demande.client,'livraison_assignee','Livreur trouvé','Votre livraison a été assignée et sera bientôt prise en charge.','/profil');
    res.json(demande);
  }catch(e){console.error(e);res.status(500).json({message:'Erreur serveur.'});}
};

module.exports = {
  createDemande,
  getDemandesDisponibles,
  accepterDemande,
  updateStatutDemande,
  getMesLivraisons,
  getMesDemandes,
  estimerLivraison,
  validerRecuperation,
  validerLivraison,
  assignerLivraison,
  getDemandeById
};
