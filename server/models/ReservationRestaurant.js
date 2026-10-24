const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  categorie: { type: mongoose.Schema.Types.ObjectId, ref: 'CategorieEmplacementRestaurant', required: true },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'TableRestaurant', default: null },
  reference: { type: String, unique: true, sparse: true },
  date: { type: Date, required: true },
  heure: { type: String, required: true, trim: true },
  nombrePersonnes: { type: Number, required: true, min: 1 },
  fraisReservation: { type: Number, required: true, min: 0 },
  modeFrais: { type: String, enum: ['non_deductible', 'deductible', 'acompte'], default: 'non_deductible' },
  statut: { type: String, enum: ['en_attente_paiement', 'confirmee', 'arrivee', 'occupee', 'terminee', 'annulee', 'expiree'], default: 'en_attente_paiement' },
  paiementStatut: { type: String, enum: ['non_requis', 'en_attente', 'approuve', 'echoue', 'rembourse'], default: 'non_requis' },
  transactionPaiement: { type: mongoose.Schema.Types.ObjectId, ref: 'TransactionPaiement', default: null },
  expirePaiementA: { type: Date, default: null },
  preference: { type: String, trim: true, maxlength: 300, default: '' },
  ticketGenereLe: { type: Date, default: null }
}, { timestamps: true });
schema.index({ restaurant: 1, date: 1, heure: 1, statut: 1 });
schema.index({ client: 1, createdAt: -1 });
schema.index({ transactionPaiement: 1 }, { unique: true, sparse: true });
module.exports = mongoose.model('ReservationRestaurant', schema);
