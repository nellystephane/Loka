const Boutique = require('../models/Boutique');
const CategorieBoutique = require('../models/CategorieBoutique');
const CollectionBoutique = require('../models/CollectionBoutique');
const Produit = require('../models/Produit');

const slugifier = (value) => String(value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'element';

const boutiqueUtilisateur = async (userId) => {
  const boutique = await Boutique.findOne({ proprietaire: userId });
  if (!boutique) { const error = new Error("Vous devez d'abord créer votre boutique."); error.status = 400; throw error; }
  return boutique;
};

const slugUnique = async (Model, boutiqueId, base, excludeId) => {
  let slug = slugifier(base); let i = 2;
  while (await Model.exists({ boutique: boutiqueId, slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) slug = `${slugifier(base)}-${i++}`;
  return slug;
};

const schemaSuggestions = (req, res) => {
  const type = String(req.query.type || '').toLowerCase();
  const schemas = {
    mode: ['Matière', 'Coupe', 'Genre', 'Saison', 'Entretien'],
    vetements: ['Matière', 'Coupe', 'Genre', 'Saison', 'Entretien'],
    chaussures: ['Matière', 'Pointure', 'Genre', 'Saison'],
    alimentation: ['Ingrédients', 'Allergènes', 'Poids / volume', 'Conservation', 'Origine'],
    beaute: ['Type de peau / cheveux', 'Contenance', 'Ingrédients', 'Origine', 'Précautions'],
    electronique: ['Marque', 'Modèle', 'Capacité', 'Compatibilité', 'Garantie', 'État'],
    maison: ['Matière', 'Dimensions', 'Couleur', 'Entretien', 'Origine'],
    bijoux: ['Matière', 'Pierre', 'Taille', 'Couleur', 'Origine'],
    autre: []
  };
  const key = type.includes('vêtement') || type.includes('mode') ? 'mode' : type.includes('chauss') ? 'chaussures' : type.includes('aliment') ? 'alimentation' : type.includes('beauté') ? 'beaute' : type.includes('électron') ? 'electronique' : type.includes('maison') ? 'maison' : type.includes('bijou') ? 'bijoux' : 'autre';
  res.json({ type: key, suggestions: schemas[key] });
};

const categories = async (req, res) => {
  try { const boutique = await boutiqueUtilisateur(req.user._id); res.json(await CategorieBoutique.find({ boutique: boutique._id, actif: true }).sort({ ordre: 1, nom: 1 })); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || 'Erreur serveur.' }); }
};

const createCategory = async (req, res) => {
  try { const boutique = await boutiqueUtilisateur(req.user._id); const { nom, description = '', ordre = 0 } = req.body || {}; if (!nom?.trim()) return res.status(400).json({ message: 'Le nom de la catégorie est obligatoire.' }); const slug = await slugUnique(CategorieBoutique, boutique._id, nom); const item = await CategorieBoutique.create({ boutique: boutique._id, nom: nom.trim(), description, ordre, slug }); res.status(201).json(item); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || 'Erreur serveur.' }); }
};

const collections = async (req, res) => {
  try { const boutique = await boutiqueUtilisateur(req.user._id); res.json(await CollectionBoutique.find({ boutique: boutique._id, actif: true }).populate('produits', 'nom photos prix categorie statut').sort({ ordre: 1, createdAt: -1 })); }
  catch (e) { res.status(e.status || 500).json({ message: e.message || 'Erreur serveur.' }); }
};

const createCollection = async (req, res) => {
  try {
    const boutique = await boutiqueUtilisateur(req.user._id);
    const { nom, description = '', image = '', mode = 'manuel', produits = [], ordre = 0, regle = {} } = req.body || {};
    if (!nom?.trim()) return res.status(400).json({ message: 'Le nom de la collection est obligatoire.' });
    const ownedProducts = await Produit.find({ _id: { $in: produits }, boutique: boutique._id }).select('_id');
    const ids = ownedProducts.map((p) => p._id);
    const item = await CollectionBoutique.create({ boutique: boutique._id, nom: nom.trim(), description, image, mode, produits: ids, ordre, regle });
    await Produit.updateMany({ _id: { $in: ids }, boutique: boutique._id }, { $addToSet: { collections: item._id } });
    res.status(201).json(await item.populate('produits', 'nom photos prix categorie statut'));
  } catch (e) { res.status(e.status || 500).json({ message: e.message || 'Erreur serveur.' }); }
};


const profile = async (req, res) => {
  try {
    const boutique = await boutiqueUtilisateur(req.user._id);
    const [produits, categories, collections] = await Promise.all([
      Produit.find({ boutique: boutique._id, statut: { $ne: 'archive' } }).select('nom categorie categorieId collections photos prix createdAt nombreVues estMisEnAvant statut quantiteDisponible').lean(),
      CategorieBoutique.find({ boutique: boutique._id, actif: true }).select('nom slug ordre').lean(),
      CollectionBoutique.find({ boutique: boutique._id, actif: true }).select('nom mode produits ordre').lean()
    ]);
    const now = Date.now();
    const recent = produits.filter((p) => now - new Date(p.createdAt).getTime() <= 1000 * 60 * 60 * 24 * 30);
    const populaire = [...produits].sort((a,b) => (b.nombreVues || 0) - (a.nombreVues || 0)).slice(0, 8);
    res.json({
      richesse: { score: Math.min(100, produits.length * 4 + categories.length * 8 + collections.length * 10 + recent.filter(p => p.photos?.length).length * 2), produits: produits.length, categories: categories.length, collections: collections.length },
      sections: {
        nouvellesArrivees: recent.slice(0, 8),
        produitsPopulaires: populaire,
        categories,
        collections,
        peutAfficherHistoire: Boolean(boutique.description),
        peutAfficherGalerie: produits.some((p) => (p.photos || []).length > 1)
      }
    });
  } catch (e) { res.status(e.status || 500).json({ message: e.message || 'Erreur serveur.' }); }
};

module.exports = { schemaSuggestions, categories, createCategory, collections, createCollection, profile };
