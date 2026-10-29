const AgenceLivraison = require('../models/AgenceLivraison');
const Livreur = require('../models/Livreur');
const priorite = require('../utils/tarificationPro').priorite;
const DemandeLivraison = require('../models/DemandeLivraison');

const annuaire = async(req,res)=>{try{const agences=await AgenceLivraison.find({statut:'active'}).select('nom description zones telephone statut abonnementPro createdAt').sort({'abonnementPro.priorite':-1,createdAt:-1}).limit(50).lean();res.json({agences});}catch(e){res.status(500).json({message:'Impossible de charger les agences de livraison.'});}};

const creer = async (req,res)=>{ try { const {nom,description,zones,telephone}=req.body||{}; if(!nom) return res.status(400).json({message:'Nom obligatoire.'}); const a=await AgenceLivraison.create({proprietaire:req.user._id,nom,description,zones:Array.isArray(zones)?zones:[],telephone:telephone||''}); res.status(201).json(a); } catch(e){res.status(500).json({message:'Erreur serveur.'});} };
const moi = async(req,res)=>{ const a=await AgenceLivraison.findOne({proprietaire:req.user._id}).populate('livreurs','nom prenom telephone'); res.json(a); };

const demandes = async (req,res)=>{
  try{
    const agence=await AgenceLivraison.findOne({proprietaire:req.user._id});
    if(!agence) return res.status(404).json({message:'Agence introuvable.'});
    const items=await DemandeLivraison.find({agence:agence._id})
      .populate('client','nom prenom telephone')
      .populate('vendeur','nom prenom telephone')
      .populate('livreur','nom prenom telephone')
      .sort({createdAt:-1});
    res.json(items);
  }catch(e){console.error(e);res.status(500).json({message:'Impossible de charger les missions de l’agence.'});}
};

const affecterLivreur = async (req,res)=>{
  try{
    const agence=await AgenceLivraison.findOne({proprietaire:req.user._id});
    if(!agence) return res.status(404).json({message:'Agence introuvable.'});
    const demande=await DemandeLivraison.findOne({_id:req.params.id,agence:agence._id});
    if(!demande) return res.status(404).json({message:'Mission introuvable dans cette agence.'});
    const livreurId=String(req.body?.livreurId||'');
    if(!livreurId || !agence.livreurs.some(id=>String(id)===livreurId)) return res.status(400).json({message:'Ce livreur ne fait pas partie de votre agence.'});
    const livreur=await Livreur.findOne({utilisateur:livreurId,statut:'active'});
    if(!livreur) return res.status(404).json({message:'Livreur introuvable ou inactif.'});
    const actif=await DemandeLivraison.exists({livreur:livreurId,statut:{$in:['assignée','en_cours','en_route','arrivée']}});
    if(actif) return res.status(409).json({message:'Ce livreur est déjà engagé sur une mission.'});
    demande.livreur=livreur.utilisateur;
    demande.statut='assignée';
    demande.historiqueStatuts.push({statut:'assignée',par:req.user._id,note:'Mission affectée par l’agence.'});
    await demande.save();
    res.json(demande);
  }catch(e){console.error(e);res.status(500).json({message:'Impossible d’affecter le livreur.'});}
};

const ajouterLivreur = async(req,res)=>{ try{const a=await AgenceLivraison.findOne({proprietaire:req.user._id}); if(!a) return res.status(404).json({message:'Agence introuvable.'}); const l=await Livreur.findOne({utilisateur:req.body.livreurId}); if(!l) return res.status(404).json({message:'Livreur introuvable.'}); if(!a.livreurs.some(x=>x.toString()===l.utilisateur.toString())) a.livreurs.push(l.utilisateur); if(!l.agences.some(x=>x.toString()===a._id.toString())) l.agences.push(a._id); await Promise.all([a.save(),l.save()]); res.json(a); }catch(e){res.status(500).json({message:'Erreur serveur.'});} };
module.exports={creer,moi,annuaire,demandes,affecterLivreur,ajouterLivreur};
