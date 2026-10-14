const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  proprietaire: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  nom: { type: String, required: true, trim: true, maxlength: 80 },
  categorie: { type: String, trim: true, maxlength: 60, default: 'professionnel' },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  telephone: { type: String, trim: true, default: '' },
  whatsapp: { type: String, trim: true, default: '' },
  photos: { type: [String], default: [] },
  localisation: { pays:{type:String,default:'Bénin'}, ville:String, quartier:String, details:String, latitude:Number, longitude:Number },
  statut: { type: String, enum: ['active','suspendue'], default:'active' },
  vitrine: { actif:{type:Boolean,default:true}, publiee:{type:Boolean,default:true} },
  activite: { statut:{type:String,enum:['active','suspendue','en_configuration'],default:'active'} },
  finance: { statut:{type:String,enum:['incomplete','prete','bloquee'],default:'incomplete'} },
  abonnementPro: { actif:{type:Boolean,default:false}, plan:{type:String,enum:['presence_mensuel','presence_annuel',null],default:null}, dateFin:{type:Date,default:null}, priorite:{type:Number,default:0} }
},{timestamps:true});
schema.index({nom:'text',description:'text',categorie:'text'});
module.exports=mongoose.model('PresenceProfessionnelle',schema);
