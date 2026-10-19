const mongoose = require('mongoose');
const stopSchema = new mongoose.Schema({
  type: { type: String, enum: ['pickup', 'dropoff'], required: true },
  ordre: { type: Number, required: true },
  utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  commande: { modele: String, id: mongoose.Schema.Types.ObjectId },
  adresse: { ville:String, quartier:String, details:String, latitude:Number, longitude:Number, mapUrl:String },
  montantAlloue: { type: Number, default: 0 }
}, {_id:true});
const schema = new mongoose.Schema({
  createur: { type: mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  livreur: { type: mongoose.Schema.Types.ObjectId, ref:'User', default:null },
  agence: { type: mongoose.Schema.Types.ObjectId, ref:'AgenceLivraison', default:null },
  stops: { type:[stopSchema], default:[] },
  montantTotal: { type:Number, default:0, min:0 },
  statut: { type:String, enum:['en_attente','assignée','en_route','terminée','annulée'], default:'en_attente' },
  partageFrais: { type:String, enum:['proportionnel','fixe','gratuit'], default:'proportionnel' }
},{timestamps:true});
schema.index({ livreur:1, statut:1 });
module.exports = mongoose.model('MissionLivraison', schema);
