const mongoose = require('mongoose');

// Réservation d'un hébergement. La catégorie (chambre) décrit l'offre vendue ;
// l'unité identifie, lorsque disponible, la chambre physique attribuée.
const reservationSchema = new mongoose.Schema({

  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hotelier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  chambre: { type: mongoose.Schema.Types.ObjectId, ref: 'Chambre', required: true },
  uniteHebergement: { type: mongoose.Schema.Types.ObjectId, ref: 'UniteHebergement', default: null },

  dateArrivee: { type: Date, required: true },
  dateDepart: { type: Date, required: true },
  nombreNuits: { type: Number, required: true, min: 1 },
  montantTotal: { type: Number, required: true, min: 0 },

  statut: {
    type: String,
    enum: [
      'en_attente_paiement',
      'confirmee',
      'arrivee',
      'en_sejour',
      'terminee',
      'annulee',
      'expiree'
    ],
    default: 'en_attente_paiement'
  },

  note: { type: String, trim: true, maxlength: 300, default: '' },
  transactionPaiement: { type: mongoose.Schema.Types.ObjectId, ref: 'TransactionPaiement', default: null },
  paiementStatut: {
    type: String,
    enum: ['non_requis', 'en_attente', 'approuve', 'échoué', 'rembourse'],
    default: 'en_attente'
  },
  expirePaiementA: { type: Date, default: null },
  reservationReference: { type: String, unique: true, sparse: true },
  prixUnitaireNuit: { type: Number, default: 0, min: 0 }

}, {
  timestamps: true
});

reservationSchema.index({ client: 1 });
reservationSchema.index({ hotelier: 1, statut: 1, dateArrivee: 1 });
reservationSchema.index({ hotel: 1, chambre: 1, statut: 1, dateArrivee: 1, dateDepart: 1 });
reservationSchema.index({ uniteHebergement: 1, statut: 1, dateArrivee: 1, dateDepart: 1 });
reservationSchema.index({ transactionPaiement: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Reservation', reservationSchema);
