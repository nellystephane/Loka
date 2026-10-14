const mongoose = require('mongoose');

// ─── Message (Messagerie) ───
const messageSchema = new mongoose.Schema({

  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  expediteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // ─── Type de message : "texte" (défaut, comportement historique), "offre"
  // pour une proposition de commande négociée (cf. Offre.js), ou "livraison"
  // pour une proposition de livraison négociée (cf. OffreLivraison.js) —
  // les deux objets métier interactifs du chat (section 1.4 / 6.2 / 7.2). ───
  type: {
    type: String,
    enum: ['texte', 'offre', 'livraison'],
    default: 'texte'
  },
  // "contenu" reste obligatoire pour un message texte classique, mais devient
  // facultatif dès qu'une pièce jointe, une offre ou une proposition de
  // livraison est fournie (un message peut être uniquement un objet
  // interactif, sans texte).
  contenu: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: '',
    required: function () { return !this.pieceJointe?.url && !this.offre && !this.offreLivraison; }
  },
  // ─── Référence vers l'Offre que ce message matérialise dans le fil,
  // absente sur tous les messages existants (aucune migration nécessaire). ───
  offre: { type: mongoose.Schema.Types.ObjectId, ref: 'Offre', default: null },
  // ─── Référence vers l'OffreLivraison que ce message matérialise dans le
  // fil, absente sur tous les messages existants (aucune migration
  // nécessaire). ───
  offreLivraison: { type: mongoose.Schema.Types.ObjectId, ref: 'OffreLivraison', default: null },
  // ─── Pièce jointe optionnelle : image, PDF ou document courant.
  // Absent sur tous les messages existants — aucune migration nécessaire. ───
  pieceJointe: {
    url: { type: String, trim: true },
    nom: { type: String, trim: true },
    type: { type: String, trim: true },
    taille: { type: Number }
  },
  lu: { type: Boolean, default: false }

}, {
  timestamps: true
});

messageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
