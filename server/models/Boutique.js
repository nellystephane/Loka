const mongoose = require('mongoose');

// ─── Boutique (Espace Vente) ───
// Une vitrine personnalisable appartenant à un utilisateur : couleurs,
// bannière, logo. Un utilisateur ne possède qu'une seule boutique.
const boutiqueSchema = new mongoose.Schema({

  proprietaire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  nom: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },

  // ─── Personnalisation de la vitrine ───
  logo: {
    type: String,
    default: ''
  },
  banniere: {
    type: String,
    default: ''
  },
  couleurPrincipale: {
    type: String,
    default: '#007AFF'
  },

  localisation: {
    pays: { type: String, trim: true, default: 'Bénin' },
    ville: { type: String, trim: true },
    quartier: { type: String, trim: true },
    details: { type: String, trim: true }
  },

  statut: { type: String, enum: ['active', 'suspendue'], default: 'active' },

  // États indépendants : une expiration d'abonnement ne supprime jamais la vitrine.
  vitrine: { actif: {type:Boolean,default:true}, publiee: {type:Boolean,default:true} },
  activite: { statut: {type:String,enum:['active','suspendue','en_configuration'],default:'active'} },
  finance: { statut: {type:String,enum:['incomplete','prete','bloquee'],default:'incomplete'} },

  // ─── Abonnement Pro (distinct de l'abonnement annonces classique) ───
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

boutiqueSchema.index({ proprietaire: 1 });
boutiqueSchema.index({ nom: 'text', description: 'text' });

module.exports = mongoose.model('Boutique', boutiqueSchema);
