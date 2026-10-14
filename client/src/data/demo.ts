import type { MediaItem } from '../components/media/MediaCarousel';

export const demoMedia = {
  shop: [
    {src:'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=85',alt:'Intérieur d’une boutique'},
    {src:'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=85',alt:'Collection de mode'}
  ] satisfies MediaItem[],
  restaurant: [
    {src:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85',alt:'Salle de restaurant'},
    {src:'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1600&q=85',alt:'Plat servi au restaurant'}
  ] satisfies MediaItem[],
  hotel: [
    {src:'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=85',alt:'Hôtel'},
    {src:'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=85',alt:'Chambre d’hôtel'}
  ] satisfies MediaItem[],
  product: [
    {src:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=85',alt:'Montre'},
    {src:'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1600&q=85',alt:'Montre portée'}
  ] satisfies MediaItem[]
};

export const publicItems = {
  annonce: {id:'annonce-canape',type:'annonce' as const,title:'Canapé 3 places',subtitle:'Bon état · Maison',description:'Canapé trois places disponible immédiatement. Contact direct avec le vendeur pour convenir des détails.',location:'Cotonou, Agla',price:'185 000 FCFA',media:demoMedia.product},
  shop: {id:'maison-naya',type:'boutique' as const,title:'Maison Naya',subtitle:'Mode & accessoires',description:'Une sélection locale pensée pour le quotidien, avec possibilité de commander et de contacter directement la boutique.',location:'Cotonou, Haie Vive',rating:4.8,reviews:126,media:demoMedia.shop},
  restaurant: {id:'chez-marcel',type:'restaurant' as const,title:'Chez Marcel',subtitle:'Cuisine béninoise contemporaine',description:'Restaurant local proposant une expérience simple : découvrir le menu, réserver une place ou contacter l’équipe.',location:'Cotonou, Akpakpa',rating:4.8,reviews:141,media:demoMedia.restaurant},
  hotel: {id:'hotel-azala',type:'hotel' as const,title:'Hôtel Azala',subtitle:'Boutique hôtel',description:'Établissement hôtelier avec chambres, disponibilité et réservation en ligne.',location:'Cotonou, Centre',rating:4.5,reviews:77,media:demoMedia.hotel}
};
