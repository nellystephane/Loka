const mongoose = require('mongoose');

// ─── Demande de livraison (Espace Livraison) ───
// Rattachée à une commande de l'espace Vente ou Restauration (référence
// polymorphe), OU née directement d'une proposition de livraison acceptée
// dans le chat sans commande Loka derrière (sourceType 'directe' —
// ex. livreur trouvé via une annonce simple, section 3.7). Dans ce dernier
// cas, sourceId/sourceModel restent null : voir OffreLivraison.js et
// offreLivraisonController.js, qui restent l'unique origine de ce type.
const demandeLivraisonSchema = new mongoose.Schema({

  sourceType: { type: String, enum: ['vente', 'restauration', 'directe'], required: true },
  sourceId: { type: mongoose.Schema.Types.ObjectId, default: null, refPath: 'sourceModel' },
  sourceModel: { type: String, default: null, enum: ['Commande', 'CommandeRestaurant', null] },

  // ─── Traçabilité vers la proposition de livraison négociée dans le chat
  // qui a produit cette demande, quand c'est le cas (toujours vrai pour
  // sourceType 'directe', parfois vrai pour 'vente'/'restauration' si la
  // livraison a été négociée dans la conversation plutôt que créée depuis
  // le tableau de bord vendeur). ───
  offreLivraisonOrigine: { type: mongoose.Schema.Types.ObjectId, ref: 'OffreLivraison', default: null },

  vendeur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  livreur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  agence: { type: mongoose.Schema.Types.ObjectId, ref: 'AgenceLivraison', default: null },
  origineAffectation: { type: String, enum: ['client', 'vendeur', 'restaurant', 'agence', 'livreur', 'interne'], default: 'client' },
  typeLivraison: { type: String, enum: ['independante', 'interne', 'agence', 'groupée', 'directe'], default: 'independante' },
  priseEnChargePar: { type: String, enum: ['client', 'vendeur', 'partage', 'gratuite'], default: 'client' },
  montantClient: { type: Number, default: 0, min: 0 },
  montantVendeur: { type: Number, default: 0, min: 0 },
  montantLivreur: { type: Number, default: 0, min: 0 },
  paiementStatut: { type: String, enum: ['a_la_livraison', 'en_attente', 'payé', 'échoué'], default: 'a_la_livraison' },
  paiementTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'TransactionPaiement', default: null },
  codeRecuperation: { type: String, trim: true, default: '' },
  codeLivraison: { type: String, trim: true, default: '' },
  recuperationValideeLe: { type: Date, default: null },
  livraisonValideeLe: { type: Date, default: null },
  preuveLivraison: { type: mongoose.Schema.Types.Mixed, default: null },
  historiqueStatuts: [{ statut: String, par: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, date: { type: Date, default: Date.now }, note: String }],

  adresseRecuperation: {
    ville: { type: String, trim: true },
    quartier: { type: String, trim: true },
    details: { type: String, trim: true }
  },
  adresseLivraison: {
    ville: { type: String, trim: true },
    quartier: { type: String, trim: true },
    details: { type: String, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    mapUrl: { type: String, trim: true, default: '' },
    formattedAddress: { type: String, trim: true, default: '' }
  },

  tarif: { type: Number, default: 0, min: 0 },
  missionGroupee: { type: mongoose.Schema.Types.ObjectId, ref: 'MissionLivraison', default: null },

  // ─── Statuts enrichis : les anciennes valeurs ('en_attente', 'assignée',
  // 'en_cours', 'livrée', 'annulée') restent toutes valides et inchangées
  // dans leur sens — on ajoute seulement 'en_route' et 'arrivée' entre
  // 'assignée' et 'livrée' pour un suivi plus fin, sans renommer ni
  // supprimer aucun statut existant (aucune donnée en base à migrer).
  statut: {
    type: String,
    enum: ['en_attente', 'assignée', 'en_cours', 'en_route', 'arrivée', 'livrée', 'annulée'],
    default: 'en_attente'
  }

}, {
  timestamps: true
});

demandeLivraisonSchema.index({ statut: 1 });
demandeLivraisonSchema.index({ livreur: 1 });
demandeLivraisonSchema.index({ vendeur: 1 });

module.exports = mongoose.model('DemandeLivraison', demandeLivraisonSchema);
