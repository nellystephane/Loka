const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  motDePasse: { type: String, default: null },
  fournisseurAuth: { type: String, enum: ['email', 'google'], default: 'email' },
  googleId: { type: String, unique: true, sparse: true, index: true },
  emailVerifie: { type: Boolean, default: true },
  emailVerificationTokenHash: { type: String, default: null, select: false },
  emailVerificationExpireLe: { type: Date, default: null, select: false },
  passwordResetTokenHash: { type: String, default: null, select: false },
  passwordResetExpireLe: { type: Date, default: null, select: false },
  telephone: {
    type: String,
    trim: true
  },
  paiement: {
    payoutActif: { type: Boolean, default: false },
    methode: { type: String, enum: ['mtn','moov','orange','celtiis','wave','bank', null], default: null },
    numero: { type: String, trim: true, default: '' },
    pays: { type: String, trim: true, default: 'bj' },
    nomBeneficiaire: { type: String, trim: true, default: '' },
    emailBeneficiaire: { type: String, trim: true, default: '' },
    fedaPayPayoutId: { type: String, default: null }
  },
  photo: {
    type: String,
    default: ''
  },
  localisation: {
    pays: {
      type: String,
      trim: true
    },
    ville: {
      type: String,
      trim: true
    },
    quartier: {
      type: String,
      trim: true
    },
    details: {
      type: String,
      trim: true
    }
  }, 
  estVerifie: {
    type: Boolean,
    default: false
  },
  // ─── Présence : dernier instant où l'utilisateur a été vu actif (mis à
  // jour à la déconnexion du dernier socket ouvert). Le statut "en ligne"
  // lui-même n'est jamais persisté ici : il vit uniquement en mémoire côté
  // serveur (voir utils/presence.js), ce qui évite qu'un crash serveur ou
  // une fermeture d'application laisse un utilisateur "en ligne" indéfiniment. ───
  dernierActivite: {
    type: Date,
    default: Date.now
  },
  favoris: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Annonce'
  }],

  // ─── Rôle et modération (chantier back-office / administration). Un seul
  // rôle admin plat pour l'instant — pas de granularité de permissions,
  // volontairement simple pour un back-office qui reste à ses débuts. ───
  role: {
    type: String,
    enum: ['utilisateur', 'admin'],
    default: 'utilisateur'
  },
  statut: {
    type: String,
    enum: ['actif', 'suspendu'],
    default: 'actif'
  },
  // ─── Renseigné uniquement quand statut === 'suspendu' ; conservé après
  // réactivation à titre d'historique (dernière suspension connue). ───
  suspension: {
    motif: { type: String, trim: true, default: '' },
    suspenduPar: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    dateSuspension: { type: Date, default: null },
    dateReactivation: { type: Date, default: null }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);