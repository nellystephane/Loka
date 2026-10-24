const OffreLivraison = require('../models/OffreLivraison');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Commande = require('../models/Commande');
const CommandeRestaurant = require('../models/CommandeRestaurant');
const DemandeLivraison = require('../models/DemandeLivraison');
const { creerNotification } = require('../utils/notifier');

// ─── Fenêtre par défaut avant expiration d'une proposition de livraison
// sans réponse (même logique que les offres de commande, section 6.2). ───
const DUREE_PROPOSITION_MS = 15 * 60 * 1000;

const formaterXOF = (montant) => `${Number(montant || 0).toLocaleString('fr-FR')} XOF`;

// ─── Valide un point (départ ou destination) : la description humaine est
// obligatoire, le GPS reste toujours optionnel (règle transversale n°13,
// identique à commandeController et offreController). ───
const validerPoint = (point, libelle) => {
  const details = (point?.details || '').trim();
  if (!details) return { ok: false, message: `Merci de décrire le lieu ${libelle} (repère, quartier…).` };
  return {
    ok: true,
    valeur: {
      ville: (point?.ville || '').trim(),
      quartier: (point?.quartier || '').trim(),
      details,
      latitude: typeof point?.latitude === 'number' ? point.latitude : null,
      longitude: typeof point?.longitude === 'number' ? point.longitude : null,
      mapUrl: (point?.mapUrl || '').trim()
    }
  };
};

const diffuserMessageLivraison = async (io, conversation, message, expediteurId, expediteurNomComplet, resume) => {
  if (io) io.to(`conversation:${conversation._id}`).emit('message:nouveau', message);
  const destinataire = conversation.participants.find((p) => p.toString() !== expediteurId.toString());
  if (destinataire) {
    if (io) io.to(`user:${destinataire.toString()}`).emit('conversation:maj', conversation._id);
    await creerNotification(
      io, destinataire, 'offre_livraison', `Proposition de livraison de ${expediteurNomComplet}`, resume, `/messages/${conversation._id}`
    );
  }
};

// ─── Applique paresseusement l'expiration (même approche que
// offreController.expirerSiNecessaire — pas de job externe requis). ───
const expirerSiNecessaire = async (offreLivraison, io) => {
  if (!['proposée', 'contre_proposée'].includes(offreLivraison.statut) || !offreLivraison.expireA || offreLivraison.expireA > new Date()) {
    return offreLivraison;
  }
  offreLivraison.statut = 'expirée';
  await offreLivraison.save();
  if (io) io.to(`conversation:${offreLivraison.conversation}`).emit('offreLivraison:maj', offreLivraison);
  return offreLivraison;
};

// ─── Créer une proposition de livraison dans une conversation, quelle que
// soit son origine (client → livreur, boutique → livreur, restaurant →
// livreur, ou course directe sans commande — section 7.2). ───
// POST /api/offres-livraison
const creerOffreLivraison = async (req, res) => {
  try {
    const { conversationId, commandeSource, pointDepart, destination, prixPropose, details, modePaiement } = req.body;

    if (!conversationId) return res.status(400).json({ message: 'Conversation obligatoire.' });
    const prix = Number(prixPropose);
    if (!Number.isFinite(prix) || prix < 0) {
      return res.status(400).json({ message: 'Prix proposé invalide.' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation introuvable.' });
    if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Vous ne participez pas à cette conversation." });
    }
    const destinataire = conversation.participants.find((p) => p.toString() !== req.user._id.toString());
    if (!destinataire) return res.status(400).json({ message: 'Destinataire introuvable.' });

    const depart = validerPoint(pointDepart, 'de départ');
    if (!depart.ok) return res.status(400).json({ message: depart.message });
    const arrivee = validerPoint(destination, "d'arrivée");
    if (!arrivee.ok) return res.status(400).json({ message: arrivee.message });

    // ─── Si une commande source est indiquée, vérifie qu'elle existe et que
    // l'expéditeur en est bien le vendeur (seul le vendeur négocie sa
    // livraison — le client, lui, passe par la proposition de commande). ───
    let commandeSourceValidee = { type: null, id: null };
    if (commandeSource?.type) {
      if (!['vente', 'restauration'].includes(commandeSource.type) || !commandeSource.id) {
        return res.status(400).json({ message: 'Référence de commande invalide.' });
      }
      const Model = commandeSource.type === 'vente' ? Commande : CommandeRestaurant;
      const commande = await Model.findById(commandeSource.id);
      if (!commande) return res.status(404).json({ message: 'Commande introuvable.' });
      if (commande.vendeur.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Seul le vendeur de cette commande peut en négocier la livraison.' });
      }
      commandeSourceValidee = { type: commandeSource.type, id: commande._id };
    }

    const offreLivraison = await OffreLivraison.create({
      conversation: conversation._id,
      expediteur: req.user._id,
      destinataire,
      commandeSource: commandeSourceValidee,
      pointDepart: depart.valeur,
      destination: arrivee.valeur,
      prixPropose: prix,
      details: details || '',
      modePaiement: modePaiement === 'loka' ? 'loka' : 'a_la_livraison',
      expireA: new Date(Date.now() + DUREE_PROPOSITION_MS)
    });

    const messageLivraison = await Message.create({
      conversation: conversation._id,
      expediteur: req.user._id,
      type: 'livraison',
      offreLivraison: offreLivraison._id
    });
    offreLivraison.message = messageLivraison._id;
    await offreLivraison.save();

    conversation.dernierMessage = `🚚 Proposition de livraison — ${formaterXOF(prix)}`;
    conversation.derniereActivite = new Date();
    await conversation.save();

    const io = req.app.get('io');
    await diffuserMessageLivraison(
      io, conversation, messageLivraison, req.user._id, `${req.user.prenom} ${req.user.nom}`,
      `${arrivee.valeur.ville || arrivee.valeur.details} — ${formaterXOF(prix)}`
    );

    res.status(201).json({ offreLivraison, message: messageLivraison });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Détail d'une proposition de livraison ───
// GET /api/offres-livraison/:id
const getOffreLivraison = async (req, res) => {
  try {
    let offreLivraison = await OffreLivraison.findById(req.params.id);
    if (!offreLivraison) return res.status(404).json({ message: 'Proposition introuvable.' });
    if (![offreLivraison.expediteur.toString(), offreLivraison.destinataire.toString()].includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    offreLivraison = await expirerSiNecessaire(offreLivraison, req.app.get('io'));
    res.json(offreLivraison);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Concrétise l'acceptation : crée (ou réutilise) la DemandeLivraison
// réelle — le même objet de suivi utilisé partout ailleurs sur la
// plateforme (jamais un second moteur de suivi pour les courses nées du
// chat). Si une commande source existe, on récupère son vrai client ; sinon
// (course directe) le demandeur (vendeur du modèle DemandeLivraison) et le
// client final sont la même personne : l'expéditeur de la proposition. ───
const creerDemandeLivraisonDepuisOffre = async (offreLivraison, tarifFinal) => {
  let vendeur = offreLivraison.expediteur;
  let client = offreLivraison.expediteur;
  let sourceType = 'directe';
  let sourceId = null;
  let sourceModel = null;

  if (offreLivraison.commandeSource?.type) {
    sourceType = offreLivraison.commandeSource.type;
    sourceModel = sourceType === 'vente' ? 'Commande' : 'CommandeRestaurant';
    const Model = sourceType === 'vente' ? Commande : CommandeRestaurant;
    const commande = await Model.findById(offreLivraison.commandeSource.id);
    if (commande) {
      sourceId = commande._id;
      vendeur = commande.vendeur;
      client = commande.client;
    }
  }

  return DemandeLivraison.create({
    sourceType,
    sourceId,
    sourceModel,
    offreLivraisonOrigine: offreLivraison._id,
    vendeur,
    client,
    livreur: offreLivraison.destinataire,
    adresseRecuperation: offreLivraison.pointDepart,
    adresseLivraison: offreLivraison.destination,
    tarif: tarifFinal,
    statut: 'assignée',
    paiementStatut: offreLivraison.modePaiement === 'loka' ? 'en_attente' : 'a_la_livraison'
  });
};

// ─── Accepter : le livreur (destinataire) accepte le prix proposé, ou le
// demandeur (expéditeur) accepte la contre-proposition du livreur. Dans les
// deux cas, une DemandeLivraison est créée et le suivi bascule dessus. ───
// PUT /api/offres-livraison/:id/accepter
const accepterOffreLivraison = async (req, res) => {
  try {
    let offreLivraison = await OffreLivraison.findById(req.params.id);
    if (!offreLivraison) return res.status(404).json({ message: 'Proposition introuvable.' });
    const io = req.app.get('io');
    offreLivraison = await expirerSiNecessaire(offreLivraison, io);

    const estDestinataire = offreLivraison.destinataire.toString() === req.user._id.toString();
    const estExpediteur = offreLivraison.expediteur.toString() === req.user._id.toString();
    if (!estDestinataire && !estExpediteur) return res.status(403).json({ message: 'Accès refusé.' });

    let tarifFinal;
    if (offreLivraison.statut === 'proposée' && estDestinataire) {
      tarifFinal = offreLivraison.prixPropose;
    } else if (offreLivraison.statut === 'contre_proposée' && estExpediteur) {
      tarifFinal = offreLivraison.contrePropositionPrix;
    } else if (offreLivraison.statut === 'contre_proposée' && estDestinataire) {
      return res.status(409).json({ message: 'En attente de la réponse du demandeur à votre contre-proposition.' });
    } else {
      return res.status(409).json({ message: `Cette proposition est déjà ${offreLivraison.statut}.` });
    }

    const demande = await creerDemandeLivraisonDepuisOffre(offreLivraison, tarifFinal);
    offreLivraison.statut = 'acceptée';
    offreLivraison.demandeLivraisonCreee = demande._id;
    await offreLivraison.save();

    if (io) io.to(`conversation:${offreLivraison.conversation}`).emit('offreLivraison:maj', offreLivraison);
    const conversation = await Conversation.findById(offreLivraison.conversation);
    if (conversation) {
      conversation.dernierMessage = `✅ Livraison convenue — ${formaterXOF(tarifFinal)}`;
      conversation.derniereActivite = new Date();
      await conversation.save();
    }

    const autrePartie = estDestinataire ? offreLivraison.expediteur : offreLivraison.destinataire;
    await creerNotification(
      io, autrePartie, 'offre_livraison_acceptee', 'Livraison convenue',
      `Course acceptée à ${formaterXOF(tarifFinal)}.`, `/messages/${offreLivraison.conversation}`
    );

    res.json({ offreLivraison, demandeLivraison: demande });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Contre-proposer : le livreur (destinataire) propose un autre prix.
// Une seule contre-proposition active à la fois. ───
// PUT /api/offres-livraison/:id/contre-proposition
const contreProposerOffreLivraison = async (req, res) => {
  try {
    const prix = Number(req.body.prix);
    if (!Number.isFinite(prix) || prix < 0) return res.status(400).json({ message: 'Prix invalide.' });

    let offreLivraison = await OffreLivraison.findById(req.params.id);
    if (!offreLivraison) return res.status(404).json({ message: 'Proposition introuvable.' });
    if (offreLivraison.destinataire.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Seul le livreur sollicité peut contre-proposer.' });
    }
    const io = req.app.get('io');
    offreLivraison = await expirerSiNecessaire(offreLivraison, io);
    if (offreLivraison.statut !== 'proposée') {
      return res.status(409).json({ message: `Cette proposition est déjà ${offreLivraison.statut}.` });
    }

    offreLivraison.contrePropositionPrix = prix;
    offreLivraison.statut = 'contre_proposée';
    await offreLivraison.save();

    if (io) io.to(`conversation:${offreLivraison.conversation}`).emit('offreLivraison:maj', offreLivraison);
    await creerNotification(
      io, offreLivraison.expediteur, 'offre_livraison_contre_proposition', 'Contre-proposition reçue',
      `Nouveau prix proposé : ${formaterXOF(prix)}.`, `/messages/${offreLivraison.conversation}`
    );

    res.json(offreLivraison);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Refuser : le livreur refuse la proposition initiale, ou le demandeur
// refuse la contre-proposition du livreur. ───
// PUT /api/offres-livraison/:id/refuser
const refuserOffreLivraison = async (req, res) => {
  try {
    let offreLivraison = await OffreLivraison.findById(req.params.id);
    if (!offreLivraison) return res.status(404).json({ message: 'Proposition introuvable.' });
    const io = req.app.get('io');
    offreLivraison = await expirerSiNecessaire(offreLivraison, io);

    const estDestinataire = offreLivraison.destinataire.toString() === req.user._id.toString();
    const estExpediteur = offreLivraison.expediteur.toString() === req.user._id.toString();
    const peutRefuser =
      (offreLivraison.statut === 'proposée' && estDestinataire) ||
      (offreLivraison.statut === 'contre_proposée' && estExpediteur);
    if (!peutRefuser) {
      if (!estDestinataire && !estExpediteur) return res.status(403).json({ message: 'Accès refusé.' });
      return res.status(409).json({ message: `Cette proposition est déjà ${offreLivraison.statut}.` });
    }

    offreLivraison.statut = 'refusée';
    await offreLivraison.save();
    if (io) io.to(`conversation:${offreLivraison.conversation}`).emit('offreLivraison:maj', offreLivraison);
    const autrePartie = estDestinataire ? offreLivraison.expediteur : offreLivraison.destinataire;
    await creerNotification(
      io, autrePartie, 'offre_livraison_refusee', 'Proposition de livraison refusée',
      'Votre proposition de livraison a été refusée.', `/messages/${offreLivraison.conversation}`
    );

    res.json(offreLivraison);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Annuler : seul l'auteur de la proposition initiale peut la retirer. ───
// PUT /api/offres-livraison/:id/annuler
const annulerOffreLivraison = async (req, res) => {
  try {
    let offreLivraison = await OffreLivraison.findById(req.params.id);
    if (!offreLivraison) return res.status(404).json({ message: 'Proposition introuvable.' });
    if (offreLivraison.expediteur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Seul l'auteur peut annuler cette proposition." });
    }
    const io = req.app.get('io');
    offreLivraison = await expirerSiNecessaire(offreLivraison, io);
    if (!['proposée', 'contre_proposée'].includes(offreLivraison.statut)) {
      return res.status(409).json({ message: `Cette proposition est déjà ${offreLivraison.statut}.` });
    }
    offreLivraison.statut = 'annulée';
    await offreLivraison.save();
    if (io) io.to(`conversation:${offreLivraison.conversation}`).emit('offreLivraison:maj', offreLivraison);
    res.json(offreLivraison);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  creerOffreLivraison,
  getOffreLivraison,
  accepterOffreLivraison,
  contreProposerOffreLivraison,
  refuserOffreLivraison,
  annulerOffreLivraison,
  expirerSiNecessaire
};
