const mongoose = require('mongoose');

const PLAN_ABONNEMENT = [
  'starter_mensuel',
  'starter_annuel',
  'pro_mensuel',
  'pro_annuel',
  'business_mensuel',
  'business_annuel',
  null
];

const hotelSchema = new mongoose.Schema({

  // ─── Identité de l'établissement ───
  proprietaire: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  nom: { type: String, required: true, trim: true, maxlength: 100 },
  slogan: { type: String, trim: true, maxlength: 160, default: '' },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  histoire: { type: String, trim: true, maxlength: 4000, default: '' },

  // ─── Identité visuelle / médias ───
  logo: { type: String, default: '' },
  photoHero: { type: String, default: '' },
  photos: { type: [String], default: [] },
  couleurPrincipale: { type: String, default: '#007AFF' },

  // ─── Services et équipements réellement proposés par l'établissement ───
  equipements: { type: [String], default: [] },
  services: { type: [String], default: [] },

  // ─── Contact ───
  contact: {
    telephone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    siteWeb: { type: String, trim: true, default: '' }
  },

  // ─── Localisation humaine + machine-identifiable ───
  // Les coordonnées GPS ne remplacent jamais les indications locales.
  localisation: {
    pays: { type: String, trim: true, default: 'Bénin' },
    ville: { type: String, trim: true, default: '' },
    arrondissement: { type: String, trim: true, default: '' },
    quartier: { type: String, trim: true, default: '' },
    adresse: { type: String, trim: true, default: '' },
    latitude: { type: Number, min: -90, max: 90, default: null },
    longitude: { type: Number, min: -180, max: 180, default: null },
    reperePrincipal: { type: String, trim: true, maxlength: 250, default: '' },
    repereSecondaire: { type: String, trim: true, maxlength: 250, default: '' },
    indicationsAcces: { type: String, trim: true, maxlength: 1000, default: '' },
    descriptionLocale: { type: String, trim: true, maxlength: 1000, default: '' }
  },

  // ─── Horaires d'accueil ───
  horaires: {
    checkIn: { type: String, trim: true, default: '14:00' },
    checkOut: { type: String, trim: true, default: '12:00' },
    accueil24h24: { type: Boolean, default: false }
  },

  // ─── Règles commerciales de base ───
  politiques: {
    annulation: { type: String, trim: true, maxlength: 1500, default: '' },
    enfants: { type: String, trim: true, maxlength: 800, default: '' },
    animaux: { type: String, trim: true, maxlength: 800, default: '' },
    fumeurs: { type: String, trim: true, maxlength: 800, default: '' },
    notes: { type: String, trim: true, maxlength: 1500, default: '' }
  },

  // ─── Publication de l'espace ───
  statut: { type: String, enum: ['active', 'suspendue'], default: 'active' },

  // ─── Abonnement : indépendant du statut de la vitrine et de l'activité ───
  abonnementPro: {
    actif: { type: Boolean, default: false },
    plan: { type: String, enum: PLAN_ABONNEMENT, default: null },
    dateFin: { type: Date, default: null },
    // 0 = inactif, 1 = Starter, 2 = Pro, 3 = Business.
    priorite: { type: Number, min: 0, max: 3, default: 0 }
  }

}, {
  timestamps: true
});

hotelSchema.index({ proprietaire: 1 });
hotelSchema.index({ nom: 'text', description: 'text', slogan: 'text', histoire: 'text' });
hotelSchema.index({ 'localisation.ville': 1, 'localisation.quartier': 1 });
hotelSchema.index({ statut: 1, 'abonnementPro.priorite': -1, createdAt: -1 });

module.exports = mongoose.model('Hotel', hotelSchema);
