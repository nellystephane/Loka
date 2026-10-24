const Boutique=require('../models/Boutique');
const Restaurant=require('../models/Restaurant');
const Hotel=require('../models/Hotel');
const Livreur=require('../models/Livreur');
const Annonce=require('../models/Annonce');
const Produit=require('../models/Produit');
const Plat=require('../models/Plat');

const score = (x) => (x.abonnementPro?.priorite||0)*100 + (x.abonnementPro?.actif?20:0) + (x.estMisEnAvant?15:0) + (x.createdAt ? Math.max(0,10-(Date.now()-new Date(x.createdAt))/86400000/10):0);
const limited = (arr,n=8)=>arr.sort((a,b)=>score(b)-score(a)).slice(0,n);

const home = async(req,res)=>{
 try{
  const [boutiques,restaurants,hotels,livreurs,annonces,produits,plats]=await Promise.all([
   Boutique.find({statut:'active', 'vitrine.publiee':true}).sort({createdAt:-1}).limit(40).lean(),
   Restaurant.find({statut:'active', 'vitrine.publiee':true}).sort({createdAt:-1}).limit(40).lean(),
   Hotel.find({statut:'active', 'vitrine.publiee':true}).sort({createdAt:-1}).limit(40).lean(),
   Livreur.find({statut:'active'}).sort({noteMoyenne:-1,createdAt:-1}).limit(40).lean(),
   Annonce.find({statut:'actif'}).sort({createdAt:-1}).limit(30).lean(),
   Produit.find({}).sort({createdAt:-1}).limit(40).lean(),
   Plat.find({disponible:true}).sort({createdAt:-1}).limit(40).lean()
  ]);
  res.json({
   featured: limited([...boutiques.map(x=>({...x,entityType:'boutique'})),...restaurants.map(x=>({...x,entityType:'restaurant'})),...hotels.map(x=>({...x,entityType:'hotel'}))],10),
   rails:{ a_decouvrir:limited([...boutiques.map(x=>({...x,entityType:'boutique'})),...restaurants.map(x=>({...x,entityType:'restaurant'})),...hotels.map(x=>({...x,entityType:'hotel'}))],8), restaurants:limited(restaurants,8), boutiques:limited(boutiques,8), hotels:limited(hotels,8), livraison:livreurs.slice(0,8), annonces_recentes:annonces.slice(0,8), produits:produits.slice(0,8), plats:plats.slice(0,8) }
  });
 }catch(e){console.error(e);res.status(500).json({message:'Erreur serveur.'});}
};
module.exports={home};
