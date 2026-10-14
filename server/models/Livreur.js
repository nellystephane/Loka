const mongoose = require('mongoose');

const MOYENS_TRANSPORT = ['moto', 'vélo', 'voiture', 'à pied'];

// ─── Profil livreur (Espace Livraison) ───
const livreurSchema = new mongoose.Schema({

  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  employeur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  zoneCouverture: { type: [String], default: [] }, // villes/quartiers desservis
  moyenTransport: { type: String, enum: MOYENS_TRANSPORT, default: 'moto' },
  tarifBase: { type: Number, default: 500, min: 0 },
  zonesDetaillees: { type: [String], default: [] },
  tempsReponseMoyenMinutes: { type: Number, default: null, min: 0 },
  nombreLivraisons: { type: Number, default: 0, min: 0 },
  agences: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AgenceLivraison' }], // XOF, tarif indicatif de départ

  disponibilite: { type: String, enum: ['en_ligne', 'hors_ligne'], default: 'hors_ligne' },

  statut: { type: String, enum: ['active', 'suspendu'], default: 'active' },

  // ─── Notation spécifique au livreur (jamais mélangée avec les avis
  // généraux sur annonces) — dénormalisée ici pour un affichage instantané
  // sur le profil ; recalculée à chaque nouvelle évaluation par
  // evaluationLivreurController.js, jamais modifiée manuellement ailleurs. ───
  noteMoyenne: { type: Number, default: 0, min: 0, max: 5 },
  nombreEvaluations: { type: Number, default: 0, min: 0 },

  abonnementPro: {
    actif: { type: Boolean, default: false },
    plan: {
      type: String,
      enum: ['starter_mensuel', 'starter_annuel', 'pro_mensuel', 'pro_annuel', 'business_mensuel', 'business_annuel', null],
      default: null
    },
    dateFin: { type: Date, default: null },
    // Rang de priorité pour le tri de l'annuaire public (0 = inactif, 1 = Starter, 2 = Pro, 3 = Business)
    priorite: { type: Number, default: 0 }
  }

}, {
  timestamps: true
});

livreurSchema.index({ utilisateur: 1 });
livreurSchema.index({ disponibilite: 1 });

module.exports = mongoose.model('Livreur', livreurSchema);
module.exports.MOYENS_TRANSPORT = MOYENS_TRANSPORT;
