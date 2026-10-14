const Restaurant = require('../models/Restaurant');
const Categorie = require('../models/CategorieEmplacementRestaurant');
const Table = require('../models/TableRestaurant');
const Reservation = require('../models/ReservationRestaurant');
const TransactionPaiement = require('../models/TransactionPaiement');
const { creerCheckoutFedaPay } = require('../utils/fedapayClient');
const { palierDuPlan } = require('../utils/tarificationPro');

const estBusiness = r => r?.abonnementPro?.actif && palierDuPlan(r.abonnementPro.plan) === 'business' && new Date(r.abonnementPro.dateFin) > new Date();
const verifierProprietaire = async (req) => Restaurant.findOne({ _id: req.body?.restaurantId || req.params?.restaurantId, proprietaire: req.user._id });

const listerCategories = async (req,res) => {
  const restaurant = await Restaurant.findById(req.params.restaurantId);
  if (!restaurant || restaurant.statut !== 'active') return res.status(404).json({message:'Restaurant introuvable.'});
  res.json(await Categorie.find({restaurant:restaurant._id}).sort({createdAt:1}));
};

const creerCategorie = async (req,res) => {
  try {
    const restaurant = await Restaurant.findOne({_id:req.params.restaurantId,proprietaire:req.user._id});
    if (!restaurant) return res.status(404).json({message:'Restaurant introuvable.'});
    if (!estBusiness(restaurant)) return res.status(403).json({message:'La réservation de tables est disponible avec le plan Business.'});
    const {nom,description,photos,capaciteMin=1,capaciteMax,nombreTables=1,dureeMinutes=120,fraisReservation=0,modeFrais='non_deductible'}=req.body||{};
    if(!nom||!capaciteMax) return res.status(400).json({message:'Nom et capacité maximale requis.'});
    const c=await Categorie.create({restaurant:restaurant._id,nom,description,photos:Array.isArray(photos)?photos.slice(0,20):[],capaciteMin,capaciteMax,nombreTables,dureeMinutes,fraisReservation,modeFrais});
    for(let i=1;i<=Number(nombreTables);i++) await Table.create({restaurant:restaurant._id,categorie:c._id,reference:`${nom.slice(0,12).replace(/\s+/g,'-')}-${i}`});
    res.status(201).json(c);
  }catch(e){console.error(e);res.status(500).json({message:'Erreur serveur.'});}
};

const modifierCategorie = async (req,res) => {
  try { const restaurant=await Restaurant.findOne({_id:req.params.restaurantId,proprietaire:req.user._id}); if(!restaurant)return res.status(404).json({message:'Restaurant introuvable.'}); if(!estBusiness(restaurant))return res.status(403).json({message:'Fonctionnalité réservée au Business.'}); const c=await Categorie.findOneAndUpdate({_id:req.params.id,restaurant:restaurant._id},{$set:req.body},{new:true,runValidators:true}); if(!c)return res.status(404).json({message:'Catégorie introuvable.'}); res.json(c); }catch(e){res.status(400).json({message:e.message});}
};

const tables = async(req,res)=>{try{const r=await Restaurant.findOne({_id:req.params.restaurantId,proprietaire:req.user._id});if(!r)return res.status(404).json({message:'Restaurant introuvable.'});res.json(await Table.find({restaurant:r._id}).populate('categorie','nom'));}catch(e){res.status(500).json({message:'Erreur serveur.'});}};

const creerReservation = async(req,res)=>{
  try{
    const {restaurantId,categorieId,date,heure,nombrePersonnes,preference=''}=req.body||{};
    const restaurant=await Restaurant.findById(restaurantId); if(!restaurant||restaurant.statut!=='active')return res.status(404).json({message:'Restaurant introuvable.'});
    if(!estBusiness(restaurant))return res.status(403).json({message:'Les réservations de tables sont disponibles avec le plan Business.'});
    if(String(restaurant.proprietaire)===String(req.user._id))return res.status(400).json({message:'Vous ne pouvez pas réserver votre propre restaurant.'});
    const c=await Categorie.findOne({_id:categorieId,restaurant:restaurant._id,actif:true}); if(!c)return res.status(404).json({message:'Catégorie introuvable.'});
    const n=Number(nombrePersonnes); if(!Number.isInteger(n)||n<c.capaciteMin||n>c.capaciteMax)return res.status(400).json({message:'Nombre de personnes incompatible avec cette catégorie.'});
    const d=new Date(date); if(Number.isNaN(d.getTime()))return res.status(400).json({message:'Date invalide.'}); d.setHours(0,0,0,0); if(d<new Date(new Date().setHours(0,0,0,0)))return res.status(400).json({message:'La date doit être future.'});
    const reservationsOccupees=await Reservation.find({restaurant:restaurant._id,categorie:c._id,date:d,heure,statut:{$in:['confirmee','arrivee','occupee']}}).select('table');
    const tablesOccupees=reservationsOccupees.map(x=>String(x.table)).filter(Boolean);
    if(tablesOccupees.length>=c.nombreTables)return res.status(409).json({message:'Ce créneau est complet pour cette catégorie.'});
    const table=await Table.findOne({restaurant:restaurant._id,categorie:c._id,actif:true,_id:{$nin:tablesOccupees}}).sort({createdAt:1});
    if(!table)return res.status(409).json({message:'Aucune table compatible disponible pour ce créneau.'});
    const reference=`RES-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
    const frais=Number(c.fraisReservation||0); const expire=new Date(Date.now()+15*60*1000);
    const r=await Reservation.create({client:req.user._id,restaurant:restaurant._id,categorie:c._id,table:table._id,reference,date:d,heure,nombrePersonnes:n,fraisReservation:frais,modeFrais:c.modeFrais,preference,statut:frais>0?'en_attente_paiement':'confirmee',paiementStatut:frais>0?'en_attente':'non_requis',expirePaiementA:frais>0?expire:null,ticketGenereLe:frais>0?null:new Date()});
    // Une réservation payante reste en attente jusqu'au webhook.
    // La table n'est bloquée opérationnellement qu'à la confirmation backend.
    if (frais === 0 && d.toDateString() === new Date().toDateString()) { table.statut='reservee'; await table.save(); }
    if(frais>0){const tx=await TransactionPaiement.create({initiateur:req.user._id,contexte:{type:'reservation_restaurant',id:r._id},montant:frais,devise:'XOF',statut:'en_attente',expireA:expire}); r.transactionPaiement=tx._id; await r.save(); try{const checkout=await creerCheckoutFedaPay({montant:frais,description:`Loka — réservation ${restaurant.nom}`,client:{firstname:req.user.prenom,lastname:req.user.nom,email:req.user.email,...(req.user.telephone?{phone_number:{number:req.user.telephone,country:'bj'}}:{})}});tx.referenceFedaPay=checkout.referenceFedaPay;tx.lienPaiement=checkout.lienPaiement;await tx.save();return res.status(201).json({reservation:r,paiement:tx});}catch(e){await Reservation.findByIdAndDelete(r._id);await TransactionPaiement.findByIdAndDelete(tx._id);table.statut='disponible';await table.save();throw e;}}
    return res.status(201).json({reservation:r});
  }catch(e){console.error(e);res.status(500).json({message:'Impossible de créer la réservation.'});}
};

const mesReservations=async(req,res)=>res.json(await Reservation.find({client:req.user._id}).populate('restaurant','nom').populate('categorie','nom').populate('table','reference').sort({date:-1,createdAt:-1}));
const reservationsRecues=async(req,res)=>{const r=await Restaurant.findOne({proprietaire:req.user._id});if(!r)return res.status(404).json({message:'Restaurant introuvable.'});res.json(await Reservation.find({restaurant:r._id}).populate('client','nom prenom telephone').populate('categorie','nom').populate('table','reference').sort({date:1,heure:1}));};

const annulerReservationClient=async(req,res)=>{
  try{
    const reservation=await Reservation.findOne({_id:req.params.id,client:req.user._id});
    if(!reservation)return res.status(404).json({message:'Réservation introuvable dans votre compte.'});
    if(!['en_attente_paiement','confirmee'].includes(reservation.statut))return res.status(409).json({message:'Cette réservation ne peut plus être annulée depuis votre espace client.'});
    const dateReservation=new Date(reservation.date); const [hh,mm]=String(reservation.heure||'00:00').split(':').map(Number);
    dateReservation.setHours(Number.isFinite(hh)?hh:0,Number.isFinite(mm)?mm:0,0,0);
    if(dateReservation<=new Date())return res.status(409).json({message:'Une réservation ne peut être annulée en ligne qu’avant l’heure prévue.'});
    const transaction=reservation.transactionPaiement?await TransactionPaiement.findById(reservation.transactionPaiement).select('statut'):null;
    const transactionSurementNonPayee=!transaction||['échoué','expiré'].includes(transaction.statut);
    if(!transactionSurementNonPayee||!['non_requis','echoue'].includes(reservation.paiementStatut))return res.status(409).json({message:reservation.paiementStatut==='approuve'||transaction?.statut==='approuvé'?'Le paiement est confirmé. Contactez le support pour faire examiner une annulation et un éventuel remboursement.':'Un paiement est en cours ou son état est incertain. Réessayez après vérification du paiement.'});
    const updated=await Reservation.findOneAndUpdate({_id:reservation._id,client:req.user._id,statut:reservation.statut,paiementStatut:reservation.paiementStatut},{$set:{statut:'annulee',expirePaiementA:null}},{new:true,runValidators:true});
    if(!updated)return res.status(409).json({message:'La réservation a changé entre-temps. Actualisez la page avant de réessayer.'});
    if(updated.table)await Table.findByIdAndUpdate(updated.table,{statut:'disponible'});
    const restaurant=await Restaurant.findById(updated.restaurant).select('proprietaire');
    if(restaurant)await require('../utils/notifier').creerNotification(req.app.get('io'),restaurant.proprietaire,'reservation_annulee_client','Réservation annulée','Un client a annulé une réservation avant l’heure prévue.','/pro/reservations?espaceType=restauration');
    return res.json({message:'Réservation annulée.',reservation:updated});
  }catch(e){console.error(e);return res.status(500).json({message:'Impossible d’annuler cette réservation pour le moment.'});}
};

const statutReservation=async(req,res)=>{try{const r=await Reservation.findById(req.params.id);if(!r)return res.status(404).json({message:'Réservation introuvable.'});const restaurant=await Restaurant.findOne({_id:r.restaurant,proprietaire:req.user._id});if(!restaurant)return res.status(403).json({message:'Accès refusé.'});const allowed=['confirmee','arrivee','occupee','terminee','annulee'];if(!allowed.includes(req.body.statut))return res.status(400).json({message:'Statut invalide.'});r.statut=req.body.statut;await r.save();if(req.body.statut==='terminee'||req.body.statut==='annulee'){await Table.findByIdAndUpdate(r.table,{statut:'liberee'});}res.json(r);}catch(e){res.status(400).json({message:e.message});}};
module.exports={creerCategorie,modifierCategorie,listerCategories,tables,creerReservation,mesReservations,reservationsRecues,statutReservation,annulerReservationClient};
