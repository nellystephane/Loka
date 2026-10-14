const UniteHebergement = require('../models/UniteHebergement');
const Chambre = require('../models/Chambre');
const Hotel = require('../models/Hotel');
const Reservation = require('../models/Reservation');

const exigerProprietaire = async (chambreId, userId) => {
  const chambre = await Chambre.findById(chambreId);
  if (!chambre) {
    const err = new Error('Catégorie d’hébergement introuvable.');
    err.status = 404;
    throw err;
  }
  const hotel = await Hotel.findById(chambre.hotel);
  if (!hotel || hotel.proprietaire.toString() !== userId.toString()) {
    const err = new Error('Vous ne pouvez gérer que les unités de votre établissement.');
    err.status = 403;
    throw err;
  }
  return { chambre, hotel };
};

// GET /api/unites-hebergement/chambre/:chambreId
const getUnitesChambre = async (req, res) => {
  try {
    await exigerProprietaire(req.params.chambreId, req.user._id);
    const unites = await UniteHebergement.find({ chambre: req.params.chambreId }).sort({ reference: 1 });
    res.json(unites);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Erreur serveur.' });
  }
};

// POST /api/unites-hebergement
const createUnite = async (req, res) => {
  try {
    const { chambreId, reference, nom, etage, description, statut, equipements, photos } = req.body || {};
    if (!chambreId || !reference) return res.status(400).json({ message: 'La catégorie et la référence de l’unité sont obligatoires.' });

    const { chambre, hotel } = await exigerProprietaire(chambreId, req.user._id);
    const existe = await UniteHebergement.findOne({ hotel: hotel._id, reference: reference.trim() });
    if (existe) return res.status(409).json({ message: 'Cette référence d’unité existe déjà dans cet hôtel.' });

    const unite = await UniteHebergement.create({
      hotel: hotel._id,
      chambre: chambre._id,
      reference: reference.trim(),
      nom: nom || '',
      etage: etage || '',
      description: description || '',
      statut: statut || 'disponible',
      equipements: equipements || [],
      photos: photos || []
    });

    res.status(201).json(unite);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Erreur serveur.' });
  }
};

// PUT /api/unites-hebergement/:id
const updateUnite = async (req, res) => {
  try {
    const unite = await UniteHebergement.findById(req.params.id);
    if (!unite) return res.status(404).json({ message: 'Unité introuvable.' });

    await exigerProprietaire(unite.chambre, req.user._id);

    const champs = ['reference', 'nom', 'etage', 'description', 'statut', 'equipements', 'photos'];
    champs.forEach((champ) => {
      if (req.body[champ] !== undefined) unite[champ] = req.body[champ];
    });

    await unite.save();
    res.json(unite);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Erreur serveur.' });
  }
};

// DELETE /api/unites-hebergement/:id
// Une unité ayant un historique de réservation n'est jamais supprimée : elle passe hors service.
const deleteUnite = async (req, res) => {
  try {
    const unite = await UniteHebergement.findById(req.params.id);
    if (!unite) return res.status(404).json({ message: 'Unité introuvable.' });
    await exigerProprietaire(unite.chambre, req.user._id);

    const historique = await Reservation.exists({ uniteHebergement: unite._id });
    if (historique) {
      unite.statut = 'hors_service';
      await unite.save();
      return res.json({ message: 'Unité conservée pour préserver l’historique et passée hors service.', unite });
    }

    await unite.deleteOne();
    res.json({ message: 'Unité supprimée.' });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Erreur serveur.' });
  }
};

module.exports = { getUnitesChambre, createUnite, updateUnite, deleteUnite };
