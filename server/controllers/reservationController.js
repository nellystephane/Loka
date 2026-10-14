const Reservation = require('../models/Reservation');
const Chambre = require('../models/Chambre');
const Hotel = require('../models/Hotel');
const UniteHebergement = require('../models/UniteHebergement');
const { creerNotification } = require('../utils/notifier');
const TransactionPaiement = require('../models/TransactionPaiement');
const { creerCheckoutFedaPay } = require('../utils/fedapayClient');

const MS_PAR_JOUR = 1000 * 60 * 60 * 24;
const STATUTS_BLOQUANT_UNITE = ['en_attente_paiement', 'confirmee', 'arrivee', 'en_sejour'];
const TRANSITIONS = {
  en_attente_paiement: ['annulee', 'expiree'],
  confirmee: ['arrivee', 'annulee'],
  arrivee: ['en_sejour'],
  en_sejour: ['terminee'],
  terminee: [],
  annulee: [],
  expiree: []
};

const datesValides = (dateArrivee, dateDepart) => {
  const arrivee = new Date(dateArrivee);
  const depart = new Date(dateDepart);
  if (Number.isNaN(arrivee.getTime()) || Number.isNaN(depart.getTime()) || depart <= arrivee) return null;
  return { arrivee, depart };
};

const reservationsBloquantes = async ({ chambreId, uniteId = null, dateArrivee, dateDepart, exclureReservationId = null }) => {
  const filtre = {
    chambre: chambreId,
    statut: { $in: STATUTS_BLOQUANT_UNITE },
    dateArrivee: { $lt: dateDepart },
    dateDepart: { $gt: dateArrivee }
  };
  if (exclureReservationId) filtre._id = { $ne: exclureReservationId };
  if (uniteId) filtre.uniteHebergement = uniteId;
  return Reservation.find(filtre).select('_id uniteHebergement dateArrivee dateDepart statut').lean();
};

// Retourne les unités physiques libres sur toute la période demandée.
const trouverUnitesDisponibles = async (chambreId, dateArrivee, dateDepart, exclureReservationId = null) => {
  const chambre = await Chambre.findById(chambreId).lean();
  if (!chambre || !chambre.disponible) return { chambre: null, unites: [] };

  const unites = await UniteHebergement.find({
    chambre: chambreId,
    hotel: chambre.hotel,
    statut: 'disponible'
  }).sort({ reference: 1 }).lean();

  // Compatibilité avec les anciennes offres qui n'ont pas encore d'unités physiques créées.
  if (unites.length === 0) {
    const conflit = await reservationsBloquantes({ chambreId, dateArrivee, dateDepart, exclureReservationId });
    if (conflit.length === 0 && chambre.nombreUnites > 0) {
      return { chambre, unites: Array.from({ length: chambre.nombreUnites }, (_, index) => ({
        _id: null,
        reference: `virtuel-${index + 1}`,
        chambre: chambreId,
        hotel: chambre.hotel,
        virtuel: true
      })) };
    }
    return { chambre, unites: [] };
  }

  const ids = unites.map((unite) => unite._id);
  const conflits = await Reservation.find({
    uniteHebergement: { $in: ids },
    statut: { $in: STATUTS_BLOQUANT_UNITE },
    dateArrivee: { $lt: dateDepart },
    dateDepart: { $gt: dateArrivee },
    ...(exclureReservationId ? { _id: { $ne: exclureReservationId } } : {})
  }).select('uniteHebergement').lean();

  const occupees = new Set(conflits.map((reservation) => reservation.uniteHebergement.toString()));
  return {
    chambre,
    unites: unites.filter((unite) => !occupees.has(unite._id.toString()))
  };
};

const attribuerUnite = async ({ chambreId, dateArrivee, dateDepart, uniteId = null, exclureReservationId = null }) => {
  const { chambre, unites } = await trouverUnitesDisponibles(chambreId, dateArrivee, dateDepart, exclureReservationId);
  if (!chambre) return null;

  if (uniteId) {
    const choisie = unites.find((unite) => unite._id && unite._id.toString() === uniteId.toString());
    return choisie || null;
  }
  return unites[0] || null;
};

const verifierProprietaireHotel = async (hotelId, userId) => {
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) return null;
  if (hotel.proprietaire.toString() === userId.toString()) return 'proprietaire';
  return hotel;
};

// POST /api/reservations
const createReservation = async (req, res) => {
  try {
    const { chambreId, dateArrivee, dateDepart, note, uniteId } = req.body || {};
    if (!chambreId || !dateArrivee || !dateDepart) {
      return res.status(400).json({ message: "Chambre, date d'arrivée et date de départ sont obligatoires." });
    }

    const dates = datesValides(dateArrivee, dateDepart);
    if (!dates) return res.status(400).json({ message: 'Les dates de séjour sont invalides.' });

    const chambre = await Chambre.findById(chambreId);
    if (!chambre || !chambre.disponible) return res.status(404).json({ message: 'Hébergement introuvable ou indisponible.' });

    const hotel = await Hotel.findById(chambre.hotel);
    if (!hotel) return res.status(404).json({ message: 'Hôtel introuvable.' });
    if (hotel.proprietaire.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas réserver dans votre propre établissement.' });
    }

    const unite = await attribuerUnite({ chambreId, dateArrivee: dates.arrivee, dateDepart: dates.depart, uniteId });
    if (!unite) return res.status(409).json({ message: 'Aucune unité de cet hébergement n’est disponible sur cette période.' });

    const nombreNuits = Math.round((dates.depart - dates.arrivee) / MS_PAR_JOUR);
    const montantTotal = nombreNuits * chambre.prixParNuit;

    const reservation = await Reservation.create({
      client: req.user._id,
      hotelier: hotel.proprietaire,
      hotel: hotel._id,
      chambre: chambre._id,
      uniteHebergement: unite._id || null,
      dateArrivee: dates.arrivee,
      dateDepart: dates.depart,
      nombreNuits,
      montantTotal,
      prixUnitaireNuit: chambre.prixParNuit,
      note: note || '',
      statut: 'confirmee',
      paiementStatut: 'non_requis'
    });

    await creerNotification(
      req.app.get('io'),
      hotel.proprietaire,
      'nouvelle_reservation',
      'Nouvelle réservation',
      `Une réservation de ${nombreNuits} nuit${nombreNuits > 1 ? 's' : ''} vient d'être créée dans ${hotel.nom}.`,
      '/hotel'
    );

    res.status(201).json(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getMesReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ client: req.user._id })
      .populate('hotel', 'nom logo')
      .populate('chambre', 'nom type prixParNuit')
      .populate('uniteHebergement', 'reference nom etage')
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getReservationsRecues = async (req, res) => {
  try {
    const reservations = await Reservation.find({ hotelier: req.user._id })
      .populate('client', 'nom prenom photo telephone')
      .populate('chambre', 'nom type prixParNuit')
      .populate('uniteHebergement', 'reference nom etage')
      .sort({ dateArrivee: 1, createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// PUT /api/reservations/:id/statut
const updateStatutReservation = async (req, res) => {
  try {
    const { statut } = req.body || {};
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Réservation non trouvée.' });
    if (reservation.hotelier.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Seul l'hôtelier peut mettre à jour cette réservation." });
    }

    const suivants = TRANSITIONS[reservation.statut] || [];
    if (!suivants.includes(statut)) {
      return res.status(400).json({ message: `Transition impossible : ${reservation.statut} → ${statut}.` });
    }

    if (statut === 'arrivee' && new Date() < reservation.dateArrivee) {
      return res.status(400).json({ message: "L'arrivée ne peut pas être validée avant la date prévue." });
    }

    reservation.statut = statut;
    if (['annulee', 'expiree'].includes(statut)) reservation.expirePaiementA = null;
    await reservation.save();

    await creerNotification(
      req.app.get('io'),
      reservation.client,
      'statut_reservation',
      'Réservation mise à jour',
      `Votre réservation est maintenant : ${statut.replaceAll('_', ' ')}.`,
      '/profil'
    );

    res.json(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};


// POST /api/reservations/:id/annuler — annulation initiée par le client.
// Les réservations payées ou dont le paiement est encore en cours nécessitent
// une décision de remboursement/réconciliation et ne sont jamais annulées ici.
const annulerReservationClient = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({ _id: req.params.id, client: req.user._id });
    if (!reservation) return res.status(404).json({ message: 'Réservation introuvable dans votre compte.' });
    if (!['en_attente_paiement', 'confirmee'].includes(reservation.statut)) {
      return res.status(409).json({ message: 'Cette réservation ne peut plus être annulée depuis votre espace client.' });
    }
    if (new Date(reservation.dateArrivee) <= new Date()) {
      return res.status(409).json({ message: 'Une réservation ne peut être annulée en ligne qu’avant la date d’arrivée.' });
    }
    const transaction = reservation.transactionPaiement ? await TransactionPaiement.findById(reservation.transactionPaiement).select('statut') : null;
    const transactionSurementNonPayee = !transaction || ['échoué', 'expiré'].includes(transaction.statut);
    if (!transactionSurementNonPayee || !['non_requis', 'échoué'].includes(reservation.paiementStatut)) {
      return res.status(409).json({ message: reservation.paiementStatut === 'approuve' || transaction?.statut === 'approuvé'
        ? 'Le paiement est confirmé. Contactez le support pour faire examiner une annulation et un éventuel remboursement.'
        : 'Un paiement est en cours ou son état est incertain. Réessayez après vérification du paiement.' });
    }
    const annulee = await Reservation.findOneAndUpdate(
      { _id: reservation._id, client: req.user._id, statut: reservation.statut, paiementStatut: reservation.paiementStatut },
      { $set: { statut: 'annulee', expirePaiementA: null } },
      { new: true, runValidators: true }
    );
    if (!annulee) return res.status(409).json({ message: 'La réservation a changé entre-temps. Actualisez la page avant de réessayer.' });
    await creerNotification(req.app.get('io'), annulee.hotelier, 'reservation_annulee_client', 'Réservation annulée', 'Un client a annulé une réservation avant son arrivée.', '/hotel');
    return res.json({ message: 'Réservation annulée.', reservation: annulee });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Impossible d’annuler cette réservation pour le moment.' });
  }
};

// GET /api/reservations/chambre/:chambreId
const getReservationsChambre = async (req, res) => {
  try {
    const reservations = await Reservation.find({
      chambre: req.params.chambreId,
      statut: { $in: STATUTS_BLOQUANT_UNITE }
    }).select('dateArrivee dateDepart statut uniteHebergement').populate('uniteHebergement', 'reference nom');
    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/reservations/disponibilite/:chambreId?dateArrivee=...&dateDepart=...
const getDisponibiliteChambre = async (req, res) => {
  try {
    const dates = datesValides(req.query.dateArrivee, req.query.dateDepart);
    if (!dates) return res.status(400).json({ message: 'Période invalide.' });

    const { chambre, unites } = await trouverUnitesDisponibles(
      req.params.chambreId,
      dates.arrivee,
      dates.depart
    );
    if (!chambre) return res.status(404).json({ message: 'Hébergement introuvable ou indisponible.' });

    res.json({
      chambre: chambre._id,
      disponible: unites.length > 0,
      nombreDisponible: unites.length,
      unites: unites.map((unite) => ({
        id: unite._id,
        reference: unite.reference,
        nom: unite.nom || '',
        etage: unite.etage || '',
        virtuel: Boolean(unite.virtuel)
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Impossible de calculer la disponibilité.' });
  }
};

// POST /api/reservations/initier-paiement
const initierPaiementReservation = async (req, res) => {
  try {
    const { chambreId, dateArrivee, dateDepart, note, uniteId } = req.body || {};
    const dates = datesValides(dateArrivee, dateDepart);
    if (!chambreId || !dates) return res.status(400).json({ message: 'Dates ou hébergement invalides.' });

    const chambre = await Chambre.findById(chambreId);
    if (!chambre || !chambre.disponible) return res.status(404).json({ message: 'Hébergement indisponible.' });
    const hotel = await Hotel.findById(chambre.hotel);
    if (!hotel) return res.status(404).json({ message: 'Hôtel introuvable.' });
    if (hotel.proprietaire.toString() === req.user._id.toString()) return res.status(400).json({ message: 'Vous ne pouvez pas réserver votre propre établissement.' });

    const unite = await attribuerUnite({ chambreId, dateArrivee: dates.arrivee, dateDepart: dates.depart, uniteId });
    if (!unite) return res.status(409).json({ message: 'Aucune unité de cet hébergement n’est disponible sur cette période.' });

    const nombreNuits = Math.round((dates.depart - dates.arrivee) / MS_PAR_JOUR);
    const montantTotal = nombreNuits * chambre.prixParNuit;
    const expire = new Date(Date.now() + 15 * 60 * 1000);

    const reservation = await Reservation.create({
      client: req.user._id,
      hotelier: hotel.proprietaire,
      hotel: hotel._id,
      chambre: chambre._id,
      uniteHebergement: unite._id || null,
      dateArrivee: dates.arrivee,
      dateDepart: dates.depart,
      nombreNuits,
      montantTotal,
      prixUnitaireNuit: chambre.prixParNuit,
      note: note || '',
      statut: 'en_attente_paiement',
      paiementStatut: 'en_attente',
      expirePaiementA: expire
    });

    const tx = await TransactionPaiement.create({
      initiateur: req.user._id,
      contexte: { type: 'reservation', id: reservation._id },
      montant: montantTotal,
      devise: 'XOF',
      statut: 'en_attente',
      expireA: expire
    });

    reservation.transactionPaiement = tx._id;
    await reservation.save();

    try {
      const checkout = await creerCheckoutFedaPay({
        montant: montantTotal,
        description: `Loka — réservation ${hotel.nom}`,
        client: {
          firstname: req.user.prenom,
          lastname: req.user.nom,
          email: req.user.email,
          ...(req.user.telephone ? { phone_number: { number: req.user.telephone, country: 'bj' } } : {})
        }
      });
      tx.referenceFedaPay = checkout.referenceFedaPay;
      tx.lienPaiement = checkout.lienPaiement;
      await tx.save();
    } catch (e) {
      await Reservation.findByIdAndDelete(reservation._id);
      await TransactionPaiement.findByIdAndDelete(tx._id);
      throw e;
    }

    res.status(201).json({ reservation, paiement: tx });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Impossible d’initier le paiement de la réservation.' });
  }
};

module.exports = {
  createReservation,
  getMesReservations,
  getReservationsRecues,
  updateStatutReservation,
  annulerReservationClient,
  getReservationsChambre,
  getDisponibiliteChambre,
  initierPaiementReservation,
  trouverUnitesDisponibles
};
