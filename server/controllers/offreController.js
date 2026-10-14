const Offre = require('../models/Offre');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Produit = require('../models/Produit');
const Plat = require('../models/Plat');
const Annonce = require('../models/Annonce');
const Boutique = require('../models/Boutique');
const Restaurant = require('../models/Restaurant');
const Commande = require('../models/Commande');
const CommandeRestaurant = require('../models/CommandeRestaurant');
const CommandeAnnonce = require('../models/CommandeAnnonce');
const { creerNotification } = require('../utils/notifier');
const { reserverArticles, libererArticles } = require('../utils/stock');

// ─── Fenêtre de réservation/paiement d'une offre (section 6.2 : exemple
// "Expire dans : 15 minutes"). ───
const DUREE_RESERVATION_MS = 15 * 60 * 1000;

// ─── Valide la localisation de livraison : la description humaine est
// obligatoire dès qu'une livraison est demandée, le GPS reste toujours
// optionnel (règle transversale n°13). Identique à commandeController. ───
const validerAdresseLivraison = (livraisonDemandee, adresseLivraison) => {
  if (!livraisonDemandee) return { ok: true, adresse: {} };
  const description = (adresseLivraison?.details || '').trim();
  if (!description) {
    return { ok: false, message: 'Merci de décrire comment trouver le lieu de livraison.' };
  }
  return {
    ok: true,
    adresse: {
      ville: (adresseLivraison?.ville || '').trim(),
      quartier: (adresseLivraison?.quartier || '').trim(),
      details: description,
      latitude: typeof adresseLivraison?.latitude === 'number' ? adresseLivraison.latitude : null,
      longitude: typeof adresseLivraison?.longitude === 'number' ? adresseLivraison.longitude : null,
      mapUrl: (adresseLivraison?.mapUrl || '').trim(),
      formattedAddress: (adresseLivraison?.formattedAddress || '').trim()
    }
  };
};

// ─── Diffuse le message "offre" en temps réel, comme les messages texte ───
const diffuserMessageOffre = async (io, conversation, message, expediteurId, expediteurNomComplet, resume) => {
  if (io) io.to(`conversation:${conversation._id}`).emit('message:nouveau', message);
  const destinataire = conversation.participants.find((p) => p.toString() !== expediteurId.toString());
  if (destinataire) {
    if (io) io.to(`user:${destinataire.toString()}`).emit('conversation:maj', conversation._id);
    await creerNotification(
      io, destinataire, 'offre', `Proposition de commande de ${expediteurNomComplet}`, resume, `/messages/${conversation._id}`
    );
  }
};

// ─── Si l'offre est en attente et que sa fenêtre est dépassée sans
// paiement : on libère le stock réservé et on marque l'offre expirée. Appelé
// paresseusement à chaque lecture/action plutôt que via un job externe. ───
const expirerSiNecessaire = async (offre, io) => {
  if (offre.statut !== 'proposée' || !offre.expireA || offre.expireA > new Date()) return offre;
  if (offre.contexte.type === 'produit') {
    await libererArticles(offre.articles.map((a) => ({ produitId: a.produit, quantite: a.quantite })));
  }
  offre.statut = 'expirée';
  await offre.save();
  if (io) io.to(`conversation:${offre.conversation}`).emit('offre:maj', offre);
  return offre;
};

// ─── Créer une offre (proposition de commande négociée) dans une
// conversation. Le stock des lignes "produit" est réservé immédiatement
// (Disponible → Réservé, section 6.1) pour toute la durée de la fenêtre de
// paiement — jamais un simple "vérifier puis décrémenter plus tard". ───
// POST /api/offres
const creerOffre = async (req, res) => {
  try {
    const { conversationId, contexte, articles, livraisonDemandee, adresseLivraison, note } = req.body;

    if (!conversationId || !contexte?.type || !contexte?.id) {
      return res.status(400).json({ message: 'Conversation et contexte (produit/plat/annonce) obligatoires.' });
    }
    if (!Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ message: "L'offre doit contenir au moins une ligne." });
    }
    if (!['produit', 'plat', 'annonce'].includes(contexte.type)) {
      return res.status(400).json({ message: 'Type de contexte invalide.' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation introuvable.' });
    if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Vous ne participez pas à cette conversation." });
    }
    const destinataire = conversation.participants.find((p) => p.toString() !== req.user._id.toString());
    if (!destinataire) return res.status(400).json({ message: 'Destinataire introuvable.' });

    // ─── Vérifie que la source existe et recopie titre/prix courant à titre
    // indicatif — le prix négocié envoyé dans "articles" fait foi (c'est tout
    // l'intérêt d'une offre : le prix peut différer du prix catalogue). ───
    let titreContexte = '';
    if (contexte.type === 'produit') {
      const produit = await Produit.findById(contexte.id);
      if (!produit) return res.status(404).json({ message: 'Produit introuvable.' });
      titreContexte = produit.nom;
    } else if (contexte.type === 'plat') {
      const plat = await Plat.findById(contexte.id);
      if (!plat) return res.status(404).json({ message: 'Plat introuvable.' });
      titreContexte = plat.nom;
    } else {
      const annonce = await Annonce.findById(contexte.id);
      if (!annonce) return res.status(404).json({ message: 'Annonce introuvable.' });
      titreContexte = annonce.titre;
    }

    const articlesValides = [];
    let montantTotal = 0;
    for (const item of articles) {
      const nom = (item.nom || titreContexte || '').trim();
      const prixUnitaire = Number(item.prixUnitaire);
      const quantite = Math.max(1, parseInt(item.quantite) || 1);
      if (!nom || !Number.isFinite(prixUnitaire) || prixUnitaire < 0) {
        return res.status(400).json({ message: "Ligne d'offre invalide." });
      }
      articlesValides.push({
        produit: item.produitId || (contexte.type !== 'annonce' ? contexte.id : null),
        nom,
        prixUnitaire,
        quantite,
        varianteChoisie: item.varianteChoisie || ''
      });
      montantTotal += prixUnitaire * quantite;
    }

    const { ok, adresse, message: erreurAdresse } = validerAdresseLivraison(livraisonDemandee, adresseLivraison);
    if (!ok) return res.status(400).json({ message: erreurAdresse });

    // ─── Réservation atomique du stock (Disponible → Réservé), uniquement
    // pour les offres de type "produit" (les plats et annonces n'ont pas de
    // notion de stock dans le code actuel). Échec → l'offre n'est pas créée. ───
    if (contexte.type === 'produit') {
      const resultatReservation = await reserverArticles(
        articlesValides.map((a) => ({ produitId: a.produit, quantite: a.quantite }))
      );
      if (!resultatReservation.ok) {
        return res.status(409).json({ message: 'Stock insuffisant pour cette offre.' });
      }
    }

    const offre = await Offre.create({
      conversation: conversation._id,
      expediteur: req.user._id,
      destinataire,
      contexte: { type: contexte.type, id: contexte.id, titre: contexte.titre || titreContexte },
      articles: articlesValides,
      montantTotal,
      livraisonDemandee: !!livraisonDemandee,
      adresseLivraison: adresse,
      note: note || '',
      expireA: new Date(Date.now() + DUREE_RESERVATION_MS)
    });

    const messageOffre = await Message.create({
      conversation: conversation._id,
      expediteur: req.user._id,
      type: 'offre',
      offre: offre._id
    });
    offre.message = messageOffre._id;
    await offre.save();

    conversation.dernierMessage = `📦 Proposition de commande — ${montantTotal.toLocaleString('fr-FR')} XOF`;
    conversation.derniereActivite = new Date();
    await conversation.save();

    const io = req.app.get('io');
    await diffuserMessageOffre(
      io, conversation, messageOffre, req.user._id, `${req.user.prenom} ${req.user.nom}`,
      `${offre.contexte.titre} — ${montantTotal.toLocaleString('fr-FR')} XOF`
    );

    res.status(201).json({ offre, message: messageOffre });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Détail d'une offre (vérifie et applique l'expiration au passage) ───
// GET /api/offres/:id
const getOffre = async (req, res) => {
  try {
    let offre = await Offre.findById(req.params.id);
    if (!offre) return res.status(404).json({ message: 'Offre introuvable.' });
    if (![offre.expediteur.toString(), offre.destinataire.toString()].includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    offre = await expirerSiNecessaire(offre, req.app.get('io'));
    res.json(offre);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Refuser une offre (le paiement, lui, passe par
// paiementCommandeController — jamais par cette route : le frontend ne
// décide jamais qu'un paiement a réussi, seul le webhook FedaPay fait foi). ───
// PUT /api/offres/:id/reponse
const repondreOffre = async (req, res) => {
  try {
    const { reponse } = req.body; // seule valeur acceptée : 'refusée'
    if (reponse !== 'refusée') {
      return res.status(400).json({ message: "Réponse invalide. Pour payer, utilisez /api/paiements-commande/initier." });
    }

    let offre = await Offre.findById(req.params.id);
    if (!offre) return res.status(404).json({ message: 'Offre introuvable.' });
    if (offre.destinataire.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Seul le destinataire peut répondre à cette offre.' });
    }
    const io = req.app.get('io');
    offre = await expirerSiNecessaire(offre, io);
    if (offre.statut !== 'proposée') {
      return res.status(409).json({ message: `Cette offre est déjà ${offre.statut}.` });
    }

    if (offre.contexte.type === 'produit') {
      await libererArticles(offre.articles.map((a) => ({ produitId: a.produit, quantite: a.quantite })));
    }
    offre.statut = 'refusée';
    await offre.save();
    if (io) io.to(`conversation:${offre.conversation}`).emit('offre:maj', offre);
    await creerNotification(io, offre.expediteur, 'offre_refusee', 'Offre refusée', `${offre.contexte.titre} — proposition refusée.`, `/messages/${offre.conversation}`);
    res.json(offre);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Annuler une offre en attente (par son auteur uniquement) — libère le
// stock réservé comme un refus. ───
// PUT /api/offres/:id/annuler
const annulerOffre = async (req, res) => {
  try {
    let offre = await Offre.findById(req.params.id);
    if (!offre) return res.status(404).json({ message: 'Offre introuvable.' });
    if (offre.expediteur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Seul l'auteur peut annuler cette offre." });
    }
    const io = req.app.get('io');
    offre = await expirerSiNecessaire(offre, io);
    if (offre.statut !== 'proposée') {
      return res.status(409).json({ message: `Cette offre est déjà ${offre.statut}.` });
    }
    if (offre.contexte.type === 'produit') {
      await libererArticles(offre.articles.map((a) => ({ produitId: a.produit, quantite: a.quantite })));
    }
    offre.statut = 'annulée';
    await offre.save();
    if (io) io.to(`conversation:${offre.conversation}`).emit('offre:maj', offre);
    res.json(offre);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Appelée uniquement par le webhook FedaPay (paiementCommandeController)
// une fois le paiement confirmé : concrétise la vente (Réservé → Vendu) et
// crée l'objet Commande réel — jamais avant, jamais depuis le frontend. ───
const finaliserOffrePayee = async (offre) => {
  let commandeCreee;
  let modele;

  if (offre.contexte.type === 'produit') {
    const premierProduit = await Produit.findById(offre.articles[0].produit);
    if (!premierProduit) throw new Error('Produit introuvable.');
    const boutiqueCible = await Boutique.findById(premierProduit.boutique);
    if (!boutiqueCible) throw new Error('Boutique introuvable.');

    commandeCreee = await Commande.create({
      client: offre.destinataire,
      vendeur: boutiqueCible.proprietaire,
      boutique: boutiqueCible._id,
      articles: offre.articles.map((a) => ({
        produit: a.produit, nom: a.nom, prixUnitaire: a.prixUnitaire, quantite: a.quantite, varianteChoisie: a.varianteChoisie
      })),
      montantTotal: offre.montantTotal,
      livraisonDemandee: offre.livraisonDemandee,
      adresseLivraison: offre.adresseLivraison,
      note: offre.note,
      transactionPaiement: offre.transactionPaiement
    });
    modele = 'Commande';

  } else if (offre.contexte.type === 'plat') {
    const plat = await Plat.findById(offre.contexte.id);
    if (!plat) throw new Error('Plat introuvable.');
    const restaurant = await Restaurant.findById(plat.restaurant);
    if (!restaurant) throw new Error('Restaurant introuvable.');

    commandeCreee = await CommandeRestaurant.create({
      client: offre.destinataire,
      vendeur: restaurant.proprietaire,
      restaurant: restaurant._id,
      articles: offre.articles.map((a) => ({ plat: a.produit || plat._id, nom: a.nom, prixUnitaire: a.prixUnitaire, quantite: a.quantite })),
      montantTotal: offre.montantTotal,
      modeService: offre.livraisonDemandee ? 'livraison' : 'a_emporter',
      adresseLivraison: offre.adresseLivraison,
      note: offre.note,
      transactionPaiement: offre.transactionPaiement
    });
    modele = 'CommandeRestaurant';

  } else {
    const annonce = await Annonce.findById(offre.contexte.id);
    if (!annonce) throw new Error('Annonce introuvable.');
    const ligne = offre.articles[0];

    commandeCreee = await CommandeAnnonce.create({
      client: offre.destinataire,
      vendeur: annonce.createur,
      annonce: annonce._id,
      offre: offre._id,
      titre: ligne.nom,
      prixUnitaire: ligne.prixUnitaire,
      quantite: ligne.quantite,
      montantTotal: offre.montantTotal,
      livraisonDemandee: offre.livraisonDemandee,
      adresseLivraison: offre.adresseLivraison,
      note: offre.note,
      transactionPaiement: offre.transactionPaiement
    });
    modele = 'CommandeAnnonce';
  }

  offre.statut = 'payée';
  offre.commandeCreee = { modele, id: commandeCreee._id };
  await offre.save();

  const conversation = await Conversation.findById(offre.conversation);
  if (conversation) {
    conversation.dernierMessage = `✅ Commande confirmée — ${offre.montantTotal.toLocaleString('fr-FR')} XOF`;
    conversation.derniereActivite = new Date();
    await conversation.save();
  }

  return { commande: commandeCreee, modele };
};

module.exports = { creerOffre, getOffre, repondreOffre, annulerOffre, finaliserOffrePayee, expirerSiNecessaire };
