const Boutique=require('../models/Boutique');
const Restaurant=require('../models/Restaurant');
const Hotel=require('../models/Hotel');
const Livreur=require('../models/Livreur');
const Annonce=require('../models/Annonce');
const Produit=require('../models/Produit');
const Plat=require('../models/Plat');
const StorefrontConfig=require('../models/StorefrontConfig');

const score = (x) => (x.estMisEnAvant ? 3 : 0) + (x.abonnementPro?.actif ? 4 : 0) + Math.min(3, Math.max(0, Number(x.abonnementPro?.priorite || 0))) + (x.createdAt ? Math.max(0, 6 - (Date.now() - new Date(x.createdAt)) / 86400000 / 5) : 0);
const limited = (arr,n=8)=>arr.sort((a,b)=>score(b)-score(a)).slice(0,n);

const home = async(req,res)=>{
 try{
  const published=await StorefrontConfig.find({publie:true,espaceType:{$in:['vente','restauration','hotel']}}).select('espaceType espaceId').lean();
  const ids={vente:published.filter(x=>x.espaceType==='vente').map(x=>x.espaceId),restauration:published.filter(x=>x.espaceType==='restauration').map(x=>x.espaceId),hotel:published.filter(x=>x.espaceType==='hotel').map(x=>x.espaceId)};
  const [boutiques,restaurants,hotels,livreurs,annonces,produits,plats]=await Promise.all([
   Boutique.find({ _id:{$in:ids.vente}, statut:'active' }).sort({createdAt:-1}).limit(40).lean(),
   Restaurant.find({ _id:{$in:ids.restauration}, statut:'active' }).sort({createdAt:-1}).limit(40).lean(),
   Hotel.find({ _id:{$in:ids.hotel}, statut:'active' }).sort({createdAt:-1}).limit(40).lean(),
   Livreur.find({statut:'active'}).populate('utilisateur','nom prenom photo telephone localisation').sort({noteMoyenne:-1,createdAt:-1}).limit(40).lean(),
   Annonce.find({statut:'actif',dateExpiration:{$gt:new Date()}}).sort({createdAt:-1}).limit(30).lean(),
   Produit.find({boutique:{$in:ids.vente},statut:'disponible'}).sort({createdAt:-1}).limit(40).lean(),
   Plat.find({restaurant:{$in:ids.restauration},disponible:true}).sort({createdAt:-1}).limit(40).lean()
  ]);
  res.json({
   featured: limited([...boutiques.map(x=>({...x,entityType:'boutique'})),...restaurants.map(x=>({...x,entityType:'restaurant'})),...hotels.map(x=>({...x,entityType:'hotel'}))],10),
   rails:{ a_decouvrir:limited([...boutiques.map(x=>({...x,entityType:'boutique'})),...restaurants.map(x=>({...x,entityType:'restaurant'})),...hotels.map(x=>({...x,entityType:'hotel'}))],8), restaurants:limited(restaurants,8), boutiques:limited(boutiques,8), hotels:limited(hotels,8), livraison:livreurs.slice(0,8), annonces_recentes:annonces.slice(0,8), produits:produits.slice(0,8), plats:plats.slice(0,8) }
  });
 }catch(e){console.error(e);res.status(500).json({message:'Erreur serveur.'});}
};
module.exports={home};
