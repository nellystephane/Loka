const mongoose = require('mongoose');

// ─── Litige (signalement traité par l'administration) ───
// Priorité 7 de la section 11.1 : gestion des litiges par le back-office,
// « actuellement absent ». N'importe quel utilisateur peut signaler un
// problème sur une commande, une livraison, une annonce ou un autre
// utilisateur ; seul un administrateur peut ensuite le traiter.
const litigeSchema = new mongoose.Schema({

  auteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ─── Contexte du signalement — délibérément polymorphe et souple
  // (aucune contrainte de refPath) car un litige peut porter sur des objets
  // de nature très différente selon l'espace concerné. ───
  contexte: {
    type: { type: String, enum: ['commande', 'commande_restaurant', 'livraison', 'annonce', 'utilisateur', 'autre'], required: true },
    id: { type: mongoose.Schema.Types.ObjectId, default: null }
  },

  motif: { type: String, trim: true, maxlength: 120, required: true },
  description: { type: String, trim: true, maxlength: 1000, required: true },

  statut: {
    type: String,
    enum: ['ouvert', 'en_cours', 'resolu', 'rejete'],
    default: 'ouvert'
  },

  // ─── Décision de l'administrateur qui a traité le signalement. ───
  traitement: {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, trim: true, maxlength: 1000, default: '' },
    date: { type: Date, default: null }
  }

}, { timestamps: true });

litigeSchema.index({ statut: 1, createdAt: -1 });
litigeSchema.index({ auteur: 1 });

module.exports = mongoose.model('Litige', litigeSchema);
