const AgenceLivraison = require('../models/AgenceLivraison');
const Livreur = require('../models/Livreur');
const mongoose = require('mongoose');
const DemandeLivraison = require('../models/DemandeLivraison');

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


const annuairePublic = async (req,res)=>{
  try{
    const { ville, recherche, page = 1, limite = 20 } = req.query;
    const pageNum=Math.max(1,parseInt(page,10)||1);
    const limiteNum=Math.min(50,Math.max(1,parseInt(limite,10)||20));
    const filtre={statut:'active'};
    const q=String(recherche||'').trim().slice(0,80);
    if(ville) filtre.zones=new RegExp(String(ville).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');
    if(q){const rx=new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');filtre.$or=[{nom:rx},{description:rx},{zones:rx}];}
    const [agences,total]=await Promise.all([
      AgenceLivraison.find(filtre).select('nom description zones telephone abonnementPro createdAt').sort({'abonnementPro.priorite':-1,createdAt:-1}).skip((pageNum-1)*limiteNum).limit(limiteNum).lean(),
      AgenceLivraison.countDocuments(filtre)
    ]);
    res.json({agences,page:pageNum,pages:Math.ceil(total/limiteNum),total});
  }catch(e){console.error(e);res.status(500).json({message:'Impossible de charger les agences de livraison.'});}
};

const rechercherLivreurs = async (req,res)=>{
  try {
    const agence=await AgenceLivraison.findOne({proprietaire:req.user._id,statut:'active'});
    if(!agence) return res.status(404).json({message:'Agence introuvable ou suspendue.'});
    const q=String(req.query.q||'').trim().slice(0,80);
    const filtre={statut:'active'};
    const dejaRattaches=(agence.livreurs||[]).map(id=>String(id));
    if(dejaRattaches.length) filtre.utilisateur={$nin:agence.livreurs};
    const profils=await Livreur.find(filtre).populate({path:'utilisateur',select:'nom prenom photo telephone localisation statut',match:{statut:'actif'}});
    const engagements=await DemandeLivraison.find({statut:{$in:['assignée','en_cours','en_route','arrivée']},livreur:{$in:profils.map(p=>p.utilisateur?._id).filter(Boolean)}}).distinct('livreur');
    const occupes=new Set(engagements.map(id=>String(id)));
    const needle=q.toLocaleLowerCase('fr');
    const results=profils.filter(p=>p.utilisateur).map(p=>({
      id:String(p.utilisateur?._id||p.utilisateur),
      profilId:String(p._id),
      nom:[p.utilisateur?.prenom,p.utilisateur?.nom].filter(Boolean).join(' ')||'Livreur',
      photo:p.utilisateur?.photo||'',
      telephone:p.utilisateur?.telephone||'',
      ville:p.utilisateur?.localisation?.ville||'',
      zones:p.zoneCouverture||[],
      transport:p.moyenTransport,
      disponibilite:p.disponibilite,
      actifSurMission:occupes.has(String(p.utilisateur?._id)),
      tarifBase:p.tarifBase,
      noteMoyenne:p.noteMoyenne||0,
      nombreLivraisons:p.nombreLivraisons||0
    })).filter(p=>!needle||[p.nom,p.telephone,p.ville,...p.zones].join(' ').toLocaleLowerCase('fr').includes(needle))
      .sort((a,b)=>Number(a.actifSurMission)-Number(b.actifSurMission)||Number(b.disponibilite==='en_ligne')-Number(a.disponibilite==='en_ligne')||a.nom.localeCompare(b.nom,'fr'));
    res.json({livreurs:results});
  } catch(e){console.error(e);res.status(500).json({message:'Impossible de rechercher les livreurs.'});}
};

const affecterLivreur = async (req,res)=>{
  try{
    const agence=await AgenceLivraison.findOne({proprietaire:req.user._id,statut:'active'});
    if(!agence) return res.status(404).json({message:'Agence introuvable ou suspendue.'});
    const demande=await DemandeLivraison.findOne({_id:req.params.id,agence:agence._id});
    if(!demande) return res.status(404).json({message:'Mission introuvable dans cette agence.'});
    const livreurId=String(req.body?.livreurId||'');
    if(!livreurId || !agence.livreurs.some(id=>String(id)===livreurId)) return res.status(400).json({message:'Ce livreur ne fait pas partie de votre agence.'});
    const livreur=await Livreur.findOne({utilisateur:livreurId,statut:'active'}).populate('utilisateur','statut');
    if(!livreur || !livreur.utilisateur || livreur.utilisateur.statut!=='actif') return res.status(404).json({message:'Livreur introuvable ou inactif.'});
    const actif=await DemandeLivraison.exists({livreur:livreurId,statut:{$in:['assignée','en_cours','en_route','arrivée']}});
    if(actif) return res.status(409).json({message:'Ce livreur est déjà engagé sur une mission.'});
    demande.livreur=livreur.utilisateur;
    demande.statut='assignée';
    demande.historiqueStatuts.push({statut:'assignée',par:req.user._id,note:'Mission affectée par l’agence.'});
    await demande.save();
    res.json(demande);
  }catch(e){console.error(e);res.status(500).json({message:'Impossible d’affecter le livreur.'});}
};

const ajouterLivreur = async(req,res)=>{
  try{
    const agence=await AgenceLivraison.findOne({proprietaire:req.user._id,statut:'active'});
    if(!agence) return res.status(404).json({message:'Agence introuvable ou suspendue.'});
    const livreurId=String(req.body?.livreurId||'').trim();
    if(!mongoose.isValidObjectId(livreurId)) return res.status(400).json({message:'Identifiant de livreur invalide.'});
    const livreur=await Livreur.findOne({utilisateur:livreurId}).populate('utilisateur','statut nom prenom');
    if(!livreur || !livreur.utilisateur) return res.status(404).json({message:'Profil livreur introuvable.'});
    if(livreur.statut!=='active' || livreur.utilisateur.statut!=='actif') return res.status(409).json({message:'Ce livreur est suspendu ou inactif et ne peut pas rejoindre une agence.'});
    if((agence.livreurs||[]).some(id=>String(id)===livreurId) || (livreur.agences||[]).some(id=>String(id)===String(agence._id)))
      return res.status(409).json({message:'Ce livreur est déjà rattaché à votre agence.'});
    const missionActive=await DemandeLivraison.exists({livreur:livreurId,statut:{$in:['assignée','en_cours','en_route','arrivée']}});
    if(missionActive) return res.status(409).json({message:'Ce livreur est engagé sur une mission. Attendez sa clôture avant le rattachement.'});

    // Add-to-set makes repeated requests idempotent at the storage layer. Both
    // sides are updated; if the second update fails, revert the first one.
    const agenceMaj=await AgenceLivraison.findOneAndUpdate(
      {_id:agence._id,statut:'active',livreurs:{$ne:livreurId}},
      {$addToSet:{livreurs:livreurId}},
      {new:true}
    );
    if(!agenceMaj) return res.status(409).json({message:'Le rattachement a changé entre-temps. Actualisez la liste.'});
    try{
      const livreurMaj=await Livreur.findOneAndUpdate(
        {_id:livreur._id,statut:'active',agences:{$ne:agence._id}},
        {$addToSet:{agences:agence._id}},
        {new:true}
      );
      if(!livreurMaj) throw new Error('Rattachement déjà modifié ou profil désactivé.');
    }catch(updateError){
      await AgenceLivraison.updateOne({_id:agence._id},{$pull:{livreurs:livreurId}});
      return res.status(409).json({message:'Le rattachement n’a pas pu être finalisé. Actualisez puis réessayez.'});
    }
    res.json({message:'Livreur rattaché à l’agence.',agence:agenceMaj});
  }catch(e){console.error(e);res.status(500).json({message:'Impossible de rattacher ce livreur.'});}
};
module.exports={creer,moi,annuairePublic,demandes,rechercherLivreurs,affecterLivreur,ajouterLivreur};
