const UserEvent = require('../models/UserEvent');
const Partage = require('../models/Partage');

const enregistrerEvenement = async (req,res) => {
  try {
    const { type, cibleType, cibleId, contexte, sessionId } = req.body || {};
    if (!type) return res.status(400).json({ message:'Type d’événement obligatoire.' });
    const event = await UserEvent.create({ utilisateur:req.user?._id || null, type, cibleType, cibleId, contexte:contexte || {}, sessionId:sessionId || null });
    res.status(201).json({ ok:true, id:event._id });
  } catch(e) { console.error(e); res.status(500).json({message:'Erreur serveur.'}); }
};

const statistiquesPartage = async (req,res) => {
  try {
    const { cibleType, cibleId } = req.query;
    if(!cibleType || !cibleId) return res.status(400).json({message:'Cible obligatoire.'});
    const rows = await Partage.aggregate([{ $match:{cibleType,cibleId:require('mongoose').Types.ObjectId.createFromHexString(cibleId)} },{ $group:{_id:'$canal',total:{$sum:1}}},{ $sort:{total:-1}}]);
    const total=rows.reduce((s,r)=>s+r.total,0); res.json({total,canaux:Object.fromEntries(rows.map(r=>[r._id,r.total]))});
  } catch(e){res.status(400).json({message:'Cible invalide.'});}
};

const enregistrerPartage = async (req,res) => {
  try {
    const { cibleType, cibleId, canal, sessionId, referrer } = req.body || {};
    if (!cibleType || !cibleId || !canal) return res.status(400).json({message:'Cible et canal obligatoires.'});
    const partage = await Partage.create({ utilisateur:req.user?._id || null, cibleType, cibleId, canal, sessionId:sessionId || null, referrer:referrer || null });
    await UserEvent.create({ utilisateur:req.user?._id || null, type:'share', cibleType, cibleId, contexte:{ canal }, sessionId:sessionId || null });
    res.status(201).json({ok:true,id:partage._id});
  } catch(e) { console.error(e); res.status(500).json({message:'Erreur serveur.'}); }
};

module.exports = { enregistrerEvenement, enregistrerPartage, statistiquesPartage };
