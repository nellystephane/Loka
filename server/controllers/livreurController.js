const Livreur = require('../models/Livreur');

// ─── Devenir livreur (créer son profil) ───
// POST /api/livreurs
const createLivreur = async (req, res) => {
  try {
    const existant = await Livreur.findOne({ utilisateur: req.user._id });
    if (existant) {
      return res.status(409).json({ message: 'Vous avez déjà un profil livreur.' });
    }

    const { zoneCouverture, moyenTransport, tarifBase } = req.body;

    const livreur = await Livreur.create({
      utilisateur: req.user._id,
      zoneCouverture: zoneCouverture || [],
      moyenTransport: moyenTransport || 'moto',
      tarifBase: tarifBase ?? 500
    });

    res.status(201).json(livreur);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Mon profil livreur ───
// GET /api/livreurs/moi
const getMonProfil = async (req, res) => {
  try {
    const livreur = await Livreur.findOne({ utilisateur: req.user._id });
    if (!livreur) return res.status(404).json({ message: "Vous n'avez pas encore de profil livreur." });
    res.json(livreur);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Modifier mon profil / basculer en ligne-hors ligne ───
// PUT /api/livreurs/moi
const updateMonProfil = async (req, res) => {
  try {
    const livreur = await Livreur.findOne({ utilisateur: req.user._id });
    if (!livreur) return res.status(404).json({ message: "Vous n'avez pas encore de profil livreur." });

    const champsAutorises = ['zoneCouverture', 'moyenTransport', 'tarifBase', 'disponibilite'];
    champsAutorises.forEach((champ) => {
      if (req.body[champ] !== undefined) livreur[champ] = req.body[champ];
    });

    await livreur.save();
    res.json(livreur);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Annuaire des livreurs disponibles ───
// GET /api/livreurs?ville=
const getLivreurs = async (req, res) => {
  try {
    const { ville, lat, lng, rayonKm } = req.query;
    const filtre = { statut: 'active', disponibilite: 'en_ligne' };
    if (ville) {
      const escaped = String(ville).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filtre.zoneCouverture = new RegExp(escaped, 'i');
    }
    const livreurs = await Livreur.find(filtre)
      .populate('utilisateur', 'nom prenom photo telephone localisation')
      .sort({ 'abonnementPro.priorite': -1, createdAt: -1 });

    const hasCoordinates = lat !== undefined && lng !== undefined && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180;
    if (!hasCoordinates) return res.json(livreurs);

    const distanceKm = (aLat, aLng, bLat, bLng) => {
      const rad = n => n * Math.PI / 180;
      const dLat = rad(bLat - aLat), dLng = rad(bLng - aLng);
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
      return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    };
    const userLat = Number(lat), userLng = Number(lng);
    const radius = Number.isFinite(Number(rayonKm)) ? Math.min(200, Math.max(1, Number(rayonKm))) : 50;
    const withDistance = livreurs.map(item => {
      const loc = item.utilisateur?.localisation;
      const coords = loc && Number.isFinite(Number(loc.latitude)) && Number.isFinite(Number(loc.longitude)) && loc.latitude !== null && loc.longitude !== null;
      if (!coords) return { item, distanceKm: null };
      return { item, distanceKm: distanceKm(userLat, userLng, Number(loc.latitude), Number(loc.longitude)) };
    }).filter(x => x.distanceKm === null || x.distanceKm <= radius)
      .sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm !== null) return 1;
        if (b.distanceKm === null && a.distanceKm !== null) return -1;
        if (a.distanceKm !== null && b.distanceKm !== null && a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
        return Number(b.item.abonnementPro?.priorite || 0) - Number(a.item.abonnementPro?.priorite || 0);
      })
      .map(x => ({ ...x.item.toObject(), distanceKm: x.distanceKm === null ? null : Math.round(x.distanceKm * 10) / 10 }));
    res.json(withDistance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Profil public d'un livreur ───
// GET /api/livreurs/:id
const getLivreurPublic = async (req, res) => {
  try {
    const livreur = await Livreur.findOne({_id:req.params.id,statut:'active'})
      .populate({path:'utilisateur',select:'nom prenom photo telephone localisation statut',match:{statut:'actif'}});
    if (!livreur || !livreur.utilisateur) return res.status(404).json({ message: 'Profil livreur introuvable ou indisponible.' });
    const data=livreur.toObject();
    delete data.utilisateur.statut;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { createLivreur, getMonProfil, updateMonProfil, getLivreurs, getLivreurPublic };
