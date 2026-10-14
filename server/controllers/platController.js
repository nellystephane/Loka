const Plat = require('../models/Plat');
const Restaurant = require('../models/Restaurant');
const { accordeMiseEnAvant } = require('../utils/abonnementPro');
const { getPublishedSpaceIds } = require('../utils/storefrontVisibility');

const exigerRestaurant = async (userId) => {
  const restaurant = await Restaurant.findOne({ proprietaire: userId });
  if (!restaurant) {
    const err = new Error("Vous devez d'abord créer votre restaurant.");
    err.status = 400;
    throw err;
  }
  return restaurant;
};

// ─── Ajouter un plat à la carte ───
// POST /api/plats
const createPlat = async (req, res) => {
  try {
    const restaurant = await exigerRestaurant(req.user._id);
    const { nom, description, categorie, prix, photos, epice, disponible } = req.body;

    if (!nom || !categorie || prix === undefined) {
      return res.status(400).json({ message: 'Nom, catégorie et prix sont obligatoires.' });
    }

    const plat = await Plat.create({
      restaurant: restaurant._id,
      createur: req.user._id,
      nom, description: description || '', categorie, prix,
      photos: photos || [], epice: !!epice, disponible: disponible ?? true
    });

    res.status(201).json(plat);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Erreur serveur.' });
  }
};

// ─── Modifier un plat ───
// PUT /api/plats/:id
const updatePlat = async (req, res) => {
  try {
    const plat = await Plat.findById(req.params.id);
    if (!plat) return res.status(404).json({ message: 'Plat non trouvé.' });
    if (plat.createur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres plats.' });
    }

    const champsAutorises = ['nom', 'description', 'categorie', 'prix', 'photos', 'epice', 'disponible'];
    champsAutorises.forEach((champ) => {
      if (req.body[champ] !== undefined) plat[champ] = req.body[champ];
    });

    if (req.body.estMisEnAvant !== undefined) {
      const restaurant = await Restaurant.findById(plat.restaurant);
      if (accordeMiseEnAvant(restaurant?.abonnementPro)) {
        plat.estMisEnAvant = !!req.body.estMisEnAvant;
      } else if (req.body.estMisEnAvant) {
        return res.status(403).json({ message: "La mise en avant nécessite un abonnement Pro pour votre restaurant." });
      }
    }

    await plat.save();
    res.json(plat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Supprimer un plat ───
// DELETE /api/plats/:id
const deletePlat = async (req, res) => {
  try {
    const plat = await Plat.findById(req.params.id);
    if (!plat) return res.status(404).json({ message: 'Plat non trouvé.' });
    if (plat.createur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres plats.' });
    }
    await plat.deleteOne();
    res.json({ message: 'Plat supprimé avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};


// ─── Détail public d'un plat disponible ───
const getPlatById = async (req, res) => {
  try {
    const publishedSpaceIds = await getPublishedSpaceIds('restauration');
    const plat = await Plat.findOne({ _id: req.params.id, disponible: true, restaurant: { $in: publishedSpaceIds } }).populate({
      path: 'restaurant',
      match: { statut: 'active' },
      select: 'nom description logo banniere localisation proprietaire serviceSurPlace serviceAEmporter'
    });
    if (!plat || !plat.restaurant) return res.status(404).json({ message: 'Plat indisponible.' });
    return res.json(plat);
  } catch (error) {
    return res.status(500).json({ message: 'Impossible de charger ce plat.' });
  }
};

// ─── Catalogue public des plats (toutes cartes confondues) ───
// GET /api/plats?categorie=&ville=&recherche=&page=&limite=
const getPlats = async (req, res) => {
  try {
    const { categorie, ville, recherche, page = 1, limite = 20 } = req.query;
    const pageNormalisee = Math.max(1, parseInt(page) || 1);
    const limiteNormalisee = Math.min(50, Math.max(1, parseInt(limite) || 20));

    const publishedSpaceIds = await getPublishedSpaceIds('restauration');
    const filtre = { disponible: true, restaurant: { $in: publishedSpaceIds } };
    if (categorie) filtre.categorie = categorie;
    if (recherche) filtre.$text = { $search: recherche };

    const villeRegex = ville ? new RegExp(String(ville).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
    let requete = Plat.find(filtre).populate({
      path: 'restaurant',
      match: { statut: 'active', ...(villeRegex ? { 'localisation.ville': villeRegex } : {}) }
    });

    const tousLesPlats = await requete
      .sort({ estMisEnAvant: -1, createdAt: -1 })
      .skip((pageNormalisee - 1) * limiteNormalisee)
      .limit(limiteNormalisee);

    const plats = tousLesPlats.filter((p) => p.restaurant);

    res.json({ plats, page: pageNormalisee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { createPlat, updatePlat, deletePlat, getPlatById, getPlats };
