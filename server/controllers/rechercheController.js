const Boutique = require('../models/Boutique');
const Restaurant = require('../models/Restaurant');
const Hotel = require('../models/Hotel');
const Livreur = require('../models/Livreur');
const Annonce = require('../models/Annonce');
const Produit = require('../models/Produit');
const Plat = require('../models/Plat');
const StorefrontConfig = require('../models/StorefrontConfig');

const escape = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const search = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json({ results: [] });
    const rx = new RegExp(escape(q), 'i');
    const now = new Date();
    const published = await StorefrontConfig.find({ publie: true, espaceType: { $in: ['vente', 'restauration', 'hotel'] } }).select('espaceType espaceId').lean();
    const ids = { vente: published.filter((x) => x.espaceType === 'vente').map((x) => x.espaceId), restauration: published.filter((x) => x.espaceType === 'restauration').map((x) => x.espaceId), hotel: published.filter((x) => x.espaceType === 'hotel').map((x) => x.espaceId) };
    const [boutiques, restaurants, hotels, courierUsers, annonces, produits, plats] = await Promise.all([
      Boutique.find({ _id: { $in: ids.vente }, statut: 'active', nom: rx }).limit(20).lean(),
      Restaurant.find({ _id: { $in: ids.restauration }, statut: 'active', nom: rx }).limit(20).lean(),
      Hotel.find({ _id: { $in: ids.hotel }, statut: 'active', nom: rx }).limit(20).lean(),
      UserSearchUsers(rx),
      Annonce.find({ statut: 'actif', dateExpiration: { $gt: now }, $or: [{ titre: rx }, { description: rx }, { categorie: rx }] }).limit(20).lean(),
      Produit.find({ boutique: { $in: ids.vente }, statut: 'disponible', $or: [{ nom: rx }, { description: rx }, { categorie: rx }] })
        .populate({ path: 'boutique', match: { statut: 'active' }, select: 'nom localisation statut' }).limit(20).lean(),
      Plat.find({ restaurant: { $in: ids.restauration }, disponible: true, $or: [{ nom: rx }, { description: rx }, { categorie: rx }] })
        .populate({ path: 'restaurant', match: { statut: 'active' }, select: 'nom localisation statut' }).limit(20).lean(),
    ]);
    const userIds = courierUsers.map((user) => user._id);
    const livreurs = await Livreur.find({
      statut: 'active',
      disponibilite: 'en_ligne',
      $or: [{ utilisateur: { $in: userIds } }, { zoneCouverture: rx }, { zonesDetaillees: rx }],
    }).populate('utilisateur', 'nom prenom photo telephone localisation').limit(20).lean();

    const results = [
      ...boutiques.map((x) => ({ ...x, entityType: 'boutique' })),
      ...restaurants.map((x) => ({ ...x, entityType: 'restaurant' })),
      ...hotels.map((x) => ({ ...x, entityType: 'hotel' })),
      ...livreurs.map((x) => ({ ...x, nom: [x.utilisateur?.prenom, x.utilisateur?.nom].filter(Boolean).join(' '), photoHero: x.utilisateur?.photo, telephone: x.utilisateur?.telephone, localisation: x.utilisateur?.localisation, entityType: 'livreur' })),
      ...annonces.map((x) => ({ ...x, entityType: 'annonce' })),
      ...produits.filter((x) => x.boutique).map((x) => ({ ...x, boutiqueNom: x.boutique.nom, entityType: 'produit' })),
      ...plats.filter((x) => x.restaurant).map((x) => ({ ...x, localisation: x.restaurant.localisation, restaurantId: x.restaurant._id, restaurantNom: x.restaurant.nom, entityType: 'plat' })),
    ];
    res.json({ query: q, results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Recherche indisponible.' });
  }
};

// Return only categories that currently have public, discoverable content.
const categories = async (_req, res) => {
  try {
    const now = new Date();
    const [annonceRows, productRows, platRows] = await Promise.all([
      Annonce.aggregate([
        { $match: { statut: 'actif', dateExpiration: { $gt: now }, categorie: { $type: 'string', $ne: '' } } },
        { $group: { _id: '$categorie', count: { $sum: 1 } } },
      ]),
      Produit.aggregate([
        { $match: { statut: 'disponible', categorie: { $type: 'string', $ne: '' } } },
        { $lookup: { from: 'boutiques', localField: 'boutique', foreignField: '_id', as: 'ownerSpace' } },
        { $unwind: '$ownerSpace' },
        { $match: { 'ownerSpace.statut': 'active' } },
        { $lookup: { from: 'storefrontconfigs', localField: 'ownerSpace._id', foreignField: 'espaceId', as: 'publicConfig' } },
        { $unwind: '$publicConfig' },
        { $match: { 'publicConfig.espaceType': 'vente', 'publicConfig.publie': true } },
        { $group: { _id: '$categorie', count: { $sum: 1 } } },
      ]),
      Plat.aggregate([
        { $match: { disponible: true, categorie: { $type: 'string', $ne: '' } } },
        { $lookup: { from: 'restaurants', localField: 'restaurant', foreignField: '_id', as: 'ownerSpace' } },
        { $unwind: '$ownerSpace' },
        { $match: { 'ownerSpace.statut': 'active' } },
        { $lookup: { from: 'storefrontconfigs', localField: 'ownerSpace._id', foreignField: 'espaceId', as: 'publicConfig' } },
        { $unwind: '$publicConfig' },
        { $match: { 'publicConfig.espaceType': 'restauration', 'publicConfig.publie': true } },
        { $group: { _id: '$categorie', count: { $sum: 1 } } },
      ]),
    ]);
    const toItems = (rows, kind) => rows
      .filter((row) => typeof row._id === 'string' && row._id.trim())
      .map((row) => ({ name: row._id.trim(), count: row.count, kind }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    res.json({ categories: [
      ...toItems(annonceRows, 'annonce'),
      ...toItems(productRows, 'produit'),
      ...toItems(platRows, 'plat'),
    ] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Catégories indisponibles.' });
  }
};

async function UserSearchUsers(rx) {
  const User = require('../models/User');
  return User.find({ $or: [{ nom: rx }, { prenom: rx }, { telephone: rx }] })
    .select('_id nom prenom photo telephone localisation').limit(20).lean();
}

module.exports = { search, categories };
