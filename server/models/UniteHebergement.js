const mongoose = require('mongoose');

// Unité physique réelle : chambre 101, chambre 102, bungalow 3, villa A, etc.
// Une unité appartient à une offre/catégorie Chambre.
const uniteHebergementSchema = new mongoose.Schema({
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  chambre: { type: mongoose.Schema.Types.ObjectId, ref: 'Chambre', required: true },

  reference: { type: String, required: true, trim: true, maxlength: 60 },
  nom: { type: String, trim: true, maxlength: 100, default: '' },
  etage: { type: String, trim: true, maxlength: 40, default: '' },
  description: { type: String, trim: true, maxlength: 500, default: '' },

  // Hors service = indisponible indépendamment des réservations.
  statut: {
    type: String,
    enum: ['disponible', 'hors_service', 'maintenance'],
    default: 'disponible'
  },

  // Compléments propres à cette unité si nécessaire.
  equipements: { type: [String], default: [] },
  photos: { type: [String], default: [] }
}, {
  timestamps: true
});

// Une référence d'unité doit être unique à l'intérieur d'un hôtel.
uniteHebergementSchema.index({ hotel: 1, reference: 1 }, { unique: true });
uniteHebergementSchema.index({ hotel: 1, chambre: 1, statut: 1 });

module.exports = mongoose.model('UniteHebergement', uniteHebergementSchema);
