const mongoose = require('mongoose');

const categorieBoutiqueSchema = new mongoose.Schema({
  boutique: { type: mongoose.Schema.Types.ObjectId, ref: 'Boutique', required: true },
  nom: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 300, default: '' },
  slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 100 },
  ordre: { type: Number, default: 0 },
  actif: { type: Boolean, default: true },
  source: { type: String, enum: ['manuel', 'suggere'], default: 'manuel' }
}, { timestamps: true });

categorieBoutiqueSchema.index({ boutique: 1, slug: 1 }, { unique: true });
categorieBoutiqueSchema.index({ boutique: 1, ordre: 1 });

module.exports = mongoose.model('CategorieBoutique', categorieBoutiqueSchema);
