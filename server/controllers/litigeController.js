const Litige = require('../models/Litige');

// ─── Signaler un problème — accessible à tout utilisateur connecté, sur
// n'importe quel objet de la plateforme. ───
// POST /api/litiges
const creerLitige = async (req, res) => {
  try {
    const { contexte, motif, description } = req.body;
    if (!motif || !motif.trim()) return res.status(400).json({ message: 'Le motif est obligatoire.' });
    if (!description || !description.trim()) return res.status(400).json({ message: 'Merci de décrire le problème.' });

    const typesValides = ['commande', 'commande_restaurant', 'livraison', 'annonce', 'utilisateur', 'autre'];
    const typeContexte = typesValides.includes(contexte?.type) ? contexte.type : 'autre';

    const litige = await Litige.create({
      auteur: req.user._id,
      contexte: { type: typeContexte, id: contexte?.id || null },
      motif: motif.trim(),
      description: description.trim()
    });

    res.status(201).json(litige);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Mes signalements ───
// GET /api/litiges/moi
const mesLitiges = async (req, res) => {
  try {
    const litiges = await Litige.find({ auteur: req.user._id }).sort({ createdAt: -1 });
    res.json(litiges);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { creerLitige, mesLitiges };
