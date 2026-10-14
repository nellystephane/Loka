const StorefrontConfig = require('../models/StorefrontConfig');
const Boutique = require('../models/Boutique');
const Restaurant = require('../models/Restaurant');
const Hotel = require('../models/Hotel');
const Livreur = require('../models/Livreur');
const AgenceLivraison = require('../models/AgenceLivraison');
const PresenceProfessionnelle = require('../models/PresenceProfessionnelle');
const { templatesPourPlan, templateAutorise, planActif } = require('../utils/templates');
const { droits } = require('../utils/entitlements');

const MODELES = { vente:Boutique, restauration:Restaurant, hotel:Hotel, livraison:Livreur, agence_livraison:AgenceLivraison, presence:PresenceProfessionnelle };
const champProprietaire = (type) => type === 'livraison' ? 'utilisateur' : 'proprietaire';
const nomEspace = espace => espace?.nom || 'loka';
const slugifier = value => String(value || 'loka').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80) || 'loka';
const slugUnique = async (base, ignoreId=null) => { let slug=base,i=2; while(await StorefrontConfig.exists(ignoreId?{slug,_id:{$ne:ignoreId}}:{slug})) slug=`${base}-${i++}`; return slug; };
const publicationReadiness = async (espaceType, espace) => {
  const missing=[];
  if(!String(espace?.nom||'').trim()) missing.push('nom');
  if(!String(espace?.description||'').trim()) missing.push('description');
  if(!String(espace?.localisation?.ville||'').trim()) missing.push('ville');
  let contentCount=0;
  if(espaceType==='vente') contentCount=await require('../models/Produit').countDocuments({boutique:espace._id,statut:'disponible',quantiteDisponible:{$gt:0}});
  else if(espaceType==='restauration') contentCount=await require('../models/Plat').countDocuments({restaurant:espace._id,disponible:true});
  else if(espaceType==='hotel') contentCount=await require('../models/Chambre').countDocuments({hotel:espace._id,disponible:true});
  else contentCount=1;
  if(contentCount<1) missing.push(espaceType==='vente'?'au moins un produit disponible':espaceType==='restauration'?'au moins un plat disponible':espaceType==='hotel'?'au moins un hébergement disponible':'contenu public');
  return {ready:missing.length===0,missing,contentCount};
};

const get = async (req,res) => { try { const cfg=await StorefrontConfig.findOne({ espaceType:req.query.espaceType, espaceId:req.query.espaceId }); res.json(cfg||null); } catch(e){res.status(500).json({message:'Erreur serveur.'});} };

const entitlements = async (req,res) => { try { const {espaceType,espaceId}=req.query; const Model=MODELES[espaceType]; if(!Model||!espaceId)return res.status(400).json({message:'Espace invalide.'}); const espace=await Model.findById(espaceId); if(!espace)return res.status(404).json({message:'Espace introuvable.'}); if(String(espace[champProprietaire(espaceType)])!==String(req.user._id))return res.status(403).json({message:'Accès refusé.'}); res.json(droits(espace)); } catch(e){res.status(500).json({message:'Erreur serveur.'});} };

const templates = async (req,res) => {
  try {
    const {espaceType, espaceId}=req.query; const Model=MODELES[espaceType]; if(!Model||!espaceId)return res.status(400).json({message:'Espace invalide.'});
    const espace=await Model.findById(espaceId); if(!espace)return res.status(404).json({message:'Espace introuvable.'});
    const proprietaire=espace[champProprietaire(espaceType)]; if(String(proprietaire)!==String(req.user._id))return res.status(403).json({message:'Accès refusé.'});
    const plan=planActif(espace)||'starter'; res.json({plan,templates:templatesPourPlan(espaceType,plan)});
  }catch(e){res.status(500).json({message:'Erreur serveur.'});}
};

const save = async (req,res) => {
  try {
    const { espaceType, espaceId, template, accent, couleurSecondaire, couleurFond, mode, catalogueLayout, configuration, publie }=req.body||{};
    const Model=MODELES[espaceType]; if(!Model||!espaceId)return res.status(400).json({message:'Espace invalide.'});
    const espace=await Model.findById(espaceId); if(!espace||String(espace[champProprietaire(espaceType)])!==String(req.user._id))return res.status(403).json({message:'Accès refusé.'});
    const plan=planActif(espace); const planPourValidation=plan||'starter';
    if(template && !templateAutorise(template,planPourValidation)) return res.status(403).json({message:'Ce template est verrouillé pour votre plan.',template,planRequis:templatesPourPlan(espaceType,planPourValidation).find(x=>x.id===template)?.minimumPlan||'pro'});
    if(publie===true && !plan) return res.status(403).json({message:'Un abonnement professionnel actif est requis pour publier une vitrine.'});
    if(publie===true){
      const readiness=await publicationReadiness(espaceType,espace);
      if(!readiness.ready) return res.status(422).json({message:'La vitrine ne peut pas être publiée : complétez les informations et le contenu requis.',manquants:readiness.missing});
    }
    const update={espaceType,espaceId,proprietaire:req.user._id};
    if(template)update.template=template; if(accent)update.accent=accent; if(couleurSecondaire)update.couleurSecondaire=couleurSecondaire; if(couleurFond)update.couleurFond=couleurFond; if(mode)update.mode=mode; if(catalogueLayout)update.catalogueLayout=catalogueLayout; if(configuration!==undefined)update.configuration=configuration;
    if(typeof publie==='boolean'){update.publie=publie;update.publieLe=publie?new Date():null;}
    let cfg=await StorefrontConfig.findOne({proprietaire:req.user._id,espaceType,espaceId});
    if(!cfg){const slug=await slugUnique(slugifier(nomEspace(espace))); cfg=await StorefrontConfig.create({...update,slug});}
    else {Object.assign(cfg,update);cfg.version=(cfg.version||1)+1;await cfg.save();}
    res.json(cfg);
  }catch(e){console.error(e);if(e.code===11000)return res.status(409).json({message:'Cette URL publique est déjà utilisée.'});res.status(500).json({message:'Erreur serveur.'});}
};

const publicBySlug = async(req,res)=>{
  try { const cfg=await StorefrontConfig.findOne({slug:req.params.slug,publie:true}); if(!cfg)return res.status(404).send('Vitrine introuvable.'); const Model=MODELES[cfg.espaceType]; if(!Model)return res.status(404).send('Vitrine introuvable.'); const espace=await Model.findById(cfg.espaceId).lean(); if(!espace||espace.statut==='suspendue')return res.status(404).send('Vitrine indisponible.'); const title=nomEspace(espace); const desc=String(espace.description||'').replace(/[<>]/g,'').slice(0,160); const url=`${process.env.PUBLIC_APP_URL||process.env.FRONTEND_URL||''}/vitrine/${encodeURIComponent(cfg.slug)}`; const plan=planActif(espace); const templateActif=plan && templateAutorise(cfg.template,plan) ? cfg.template : (templatesPourPlan(cfg.espaceType,plan||'starter')[0]?.id || cfg.template); const jsonLd=JSON.stringify({ '@context':'https://schema.org', '@type':cfg.espaceType==='restauration'?'Restaurant':cfg.espaceType==='hotel'?'Hotel':'LocalBusiness', name:title, description:desc, url, telephone:espace.telephone||undefined, address:espace.localisation?{ '@type':'PostalAddress', addressLocality:espace.localisation.ville||'', addressCountry:espace.localisation.pays||'BJ'}:undefined }).replace(/<\/script/gi,'<\\/script'); const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title.replace(/[<>]/g,'')} — Loka</title><meta name="description" content="${desc.replace(/"/g,'&quot;')}"><link rel="canonical" href="${url}"><script type="application/ld+json">${jsonLd}</script></head><body><main><h1>${title.replace(/[<>]/g,'')}</h1><p>${desc}</p><p>Vitrine publique Loka.</p><meta name="loka-template" content="${templateActif}"><a href="${process.env.FRONTEND_URL||'/'}">Ouvrir Loka</a></main></body></html>`; res.set('Cache-Control','public,max-age=300');res.type('html').send(html); } catch(e){console.error(e);res.status(500).send('Erreur serveur.');}
};


const publicData = async (req,res) => {
  try {
    const cfg=await StorefrontConfig.findOne({slug:req.params.slug,publie:true}).lean();
    if(!cfg) return res.status(404).json({message:'Vitrine introuvable.'});
    const Model=MODELES[cfg.espaceType]; if(!Model) return res.status(404).json({message:'Vitrine introuvable.'});
    const espace=await Model.findById(cfg.espaceId).lean();
    if(!espace || espace.statut==='suspendue') return res.status(404).json({message:'Vitrine indisponible.'});
    let donnees={...espace};
    if(cfg.espaceType==='restauration'){
      const Plat=require('../models/Plat'); donnees.plats=await Plat.find({restaurant:espace._id,disponible:true}).sort({categorie:1,estMisEnAvant:-1}).lean();
      donnees.categories=await require('../models/CategorieEmplacementRestaurant').find({restaurant:espace._id,actif:true}).lean();
    }
    if(cfg.espaceType==='vente'){
      const Produit=require('../models/Produit'); donnees.produits=await Produit.find({boutique:espace._id,statut:'disponible',quantiteDisponible:{$gt:0}}).sort({estMisEnAvant:-1,createdAt:-1}).lean();
    }
    if(cfg.espaceType==='hotel'){
      const Chambre=require('../models/Chambre'); donnees.hebergements=await Chambre.find({hotel:espace._id,disponible:true}).lean();
    }
    res.set('Cache-Control','public,max-age=120').json({config:cfg,espace:donnees});
  }catch(e){console.error(e);res.status(500).json({message:'Impossible de charger la vitrine.'});}
};


const publicBySpace = async (req,res)=>{
  try{
    const aliases={boutique:'vente',restaurant:'restauration',hotel:'hotel'};
    const espaceType=aliases[req.params.type]||req.params.type;
    const cfg=await StorefrontConfig.findOne({espaceType,espaceId:req.params.id,publie:true}).lean();
    if(!cfg) return res.status(404).json({message:'Vitrine non publiée pour cet espace.'});
    const Model=MODELES[espaceType]; if(!Model) return res.status(404).json({message:'Espace introuvable.'});
    const espace=await Model.findById(req.params.id).lean();
    if(!espace || espace.statut==='suspendue') return res.status(404).json({message:'Vitrine indisponible.'});
    let donnees={...espace};
    if(espaceType==='restauration'){
      const Plat=require('../models/Plat');
      donnees.plats=await Plat.find({restaurant:espace._id,disponible:true}).sort({estMisEnAvant:-1,createdAt:-1}).lean();
    }
    if(espaceType==='vente'){
      const Produit=require('../models/Produit');
      donnees.produits=await Produit.find({boutique:espace._id,statut:'disponible',quantiteDisponible:{$gt:0}}).sort({estMisEnAvant:-1,createdAt:-1}).lean();
    }
    if(espaceType==='hotel'){
      const Chambre=require('../models/Chambre');
      donnees.hebergements=await Chambre.find({hotel:espace._id,disponible:true}).lean();
    }
    res.set('Cache-Control','public,max-age=120').json({config:cfg,espace:donnees});
  }catch(e){console.error(e);res.status(500).json({message:'Impossible de charger la vitrine.'});}
};


const editorData = async (req,res)=>{
  try{
    const {espaceType,espaceId}=req.query;
    const Model=MODELES[espaceType];
    if(!Model||!espaceId) return res.status(400).json({message:'Espace invalide.'});
    const espace=await Model.findById(espaceId).lean();
    if(!espace) return res.status(404).json({message:'Espace introuvable.'});
    const owner=espace[champProprietaire(espaceType)];
    if(String(owner)!==String(req.user._id)) return res.status(403).json({message:'Accès refusé.'});
    let donnees={...espace};
    if(espaceType==='restauration') donnees.plats=await require('../models/Plat').find({restaurant:espace._id}).sort({estMisEnAvant:-1,createdAt:-1}).lean();
    if(espaceType==='vente') donnees.produits=await require('../models/Produit').find({boutique:espace._id}).sort({estMisEnAvant:-1,createdAt:-1}).lean();
    if(espaceType==='hotel') donnees.hebergements=await require('../models/Chambre').find({hotel:espace._id}).lean();
    const cfg=await StorefrontConfig.findOne({espaceType,espaceId,proprietaire:req.user._id}).lean();
    res.json({config:cfg,espace:donnees});
  }catch(e){console.error(e);res.status(500).json({message:'Impossible de charger les données de la vitrine.'});}
};

module.exports={get,save,templates,entitlements,publicBySlug,publicData,publicBySpace,editorData,publicationReadiness};
