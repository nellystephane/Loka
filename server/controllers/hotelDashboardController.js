const Hotel = require('../models/Hotel');
const Chambre = require('../models/Chambre');
const UniteHebergement = require('../models/UniteHebergement');
const Reservation = require('../models/Reservation');

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value = new Date()) {
  const date = startOfDay(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function formatDay(date) {
  return date.toISOString().slice(0, 10);
}

const getHotelDashboard = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ proprietaire: req.user._id }).lean();
    if (!hotel) return res.status(404).json({ message: "Vous n'avez pas encore d'établissement." });

    const today = startOfDay(req.query.date ? new Date(req.query.date) : new Date());
    if (Number.isNaN(today.getTime())) return res.status(400).json({ message: 'Date de référence invalide.' });
    const rangeStart = today;
    const rangeEnd = new Date(today.getTime() + 14 * DAY);

    const [chambres, unites, reservations] = await Promise.all([
      Chambre.find({ hotel: hotel._id }).sort({ createdAt: -1 }).lean(),
      UniteHebergement.find({ hotel: hotel._id }).populate('chambre', 'nom type prixParNuit').sort({ reference: 1 }).lean(),
      Reservation.find({
        hotel: hotel._id,
        $or: [
          { dateArrivee: { $lt: rangeEnd }, dateDepart: { $gt: rangeStart } },
          { dateArrivee: { $gte: rangeStart, $lt: rangeEnd } },
          { dateDepart: { $gte: rangeStart, $lt: rangeEnd } }
        ]
      })
        .populate('client', 'nom prenom photo telephone')
        .populate('chambre', 'nom type prixParNuit')
        .populate('uniteHebergement', 'reference nom etage')
        .sort({ dateArrivee: 1, createdAt: -1 })
        .limit(100)
        .lean()
    ]);

    const bloquantes = new Set(['en_attente_paiement', 'confirmee', 'arrivee', 'en_sejour']);
    const todayEnd = endOfDay(today);
    const stats = {
      categories: chambres.length,
      unites: unites.length,
      unitesOperationnelles: unites.filter((u) => u.statut === 'disponible').length,
      arriveesAujourdhui: reservations.filter((r) => new Date(r.dateArrivee) >= today && new Date(r.dateArrivee) <= todayEnd && !['annulee', 'expiree'].includes(r.statut)).length,
      departsAujourdhui: reservations.filter((r) => new Date(r.dateDepart) >= today && new Date(r.dateDepart) <= todayEnd && !['annulee', 'expiree'].includes(r.statut)).length,
      enSejour: reservations.filter((r) => r.statut === 'en_sejour').length,
      aConfirmer: reservations.filter((r) => r.statut === 'en_attente_paiement').length,
      reservationsPeriode: reservations.filter((r) => bloquantes.has(r.statut)).length
    };

    const calendar = Array.from({ length: 14 }, (_, index) => {
      const dayStart = new Date(today.getTime() + index * DAY);
      const dayEnd = endOfDay(dayStart);
      const dayReservations = reservations.filter((r) => {
        if (!bloquantes.has(r.statut)) return false;
        return new Date(r.dateArrivee) < dayEnd && new Date(r.dateDepart) > dayStart;
      });
      return {
        date: formatDay(dayStart),
        reservations: dayReservations.length,
        arrivees: dayReservations.filter((r) => new Date(r.dateArrivee) >= dayStart && new Date(r.dateArrivee) <= dayEnd).length,
        departs: dayReservations.filter((r) => new Date(r.dateDepart) >= dayStart && new Date(r.dateDepart) <= dayEnd).length,
        unitesOccupees: new Set(dayReservations.map((r) => r.uniteHebergement?._id?.toString()).filter(Boolean)).size
      };
    });

    const categories = chambres.map((chambre) => {
      const units = unites.filter((u) => u.chambre?._id?.toString() === chambre._id.toString());
      return {
        ...chambre,
        unites: units,
        disponibiliteStructurelle: units.length || chambre.nombreUnites || 0,
        unitesDisponiblesStructurelles: units.filter((u) => u.statut === 'disponible').length
      };
    });

    res.json({
      hotel,
      stats,
      categories,
      unites,
      reservations,
      calendar,
      meta: { dateReference: formatDay(today), jours: 14 }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Impossible de charger le tableau de bord hôtelier.' });
  }
};

module.exports = { getHotelDashboard };
