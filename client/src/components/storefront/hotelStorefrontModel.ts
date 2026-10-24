/**
 * Contrat de données commun aux futures vitrines Hôtel.
 * Aucun template ne doit contenir de logique métier : il consomme uniquement ce modèle.
 */
export type HotelStorefrontUnit = {
  id: string;
  reference: string;
  nom?: string;
  etage?: string;
  statut?: 'disponible' | 'hors_service' | 'maintenance';
};

export type HotelStorefrontAccommodation = {
  id: string;
  nom: string;
  type: string;
  description?: string;
  prixParNuit: number;
  devise: 'XOF';
  capacite: number;
  capaciteAdultes?: number;
  capaciteEnfants?: number;
  photos: string[];
  equipements: string[];
  servicesInclus: string[];
  options: string[];
  disponible: boolean;
  nombreUnites: number;
  unites?: HotelStorefrontUnit[];
};

export type HotelStorefrontModel = {
  id: string;
  nom: string;
  slogan?: string;
  description: string;
  histoire?: string;
  logo?: string;
  photoHero?: string;
  photos: string[];
  equipements: string[];
  services: string[];
  contact: { telephone?: string; email?: string; siteWeb?: string };
  localisation: {
    pays: string;
    ville: string;
    arrondissement?: string;
    quartier?: string;
    adresse?: string;
    latitude?: number | null;
    longitude?: number | null;
    reperePrincipal?: string;
    repereSecondaire?: string;
    indicationsAcces?: string;
    descriptionLocale?: string;
  };
  horaires: { checkIn: string; checkOut: string; accueil24h24: boolean };
  politiques: { annulation?: string; enfants?: string; animaux?: string; fumeurs?: string; notes?: string };
  accommodations: HotelStorefrontAccommodation[];
  capabilities: {
    reservation: boolean;
    contact: boolean;
    map: boolean;
    gallery: boolean;
  };
};

export function buildHotelStorefrontModel(payload: any): HotelStorefrontModel {
  const hotel = payload?.hotel || {};
  const categories = payload?.categories || payload?.chambres || [];
  return {
    id: String(hotel._id || hotel.id || ''),
    nom: hotel.nom || 'Établissement',
    slogan: hotel.slogan || '',
    description: hotel.description || '',
    histoire: hotel.histoire || '',
    logo: hotel.logo || '',
    photoHero: hotel.photoHero || '',
    photos: hotel.photos || [],
    equipements: hotel.equipements || [],
    services: hotel.services || [],
    contact: hotel.contact || {},
    localisation: hotel.localisation || { pays: 'Bénin', ville: '' },
    horaires: hotel.horaires || { checkIn: '14:00', checkOut: '12:00', accueil24h24: false },
    politiques: hotel.politiques || {},
    accommodations: categories.map((item: any) => ({
      id: String(item._id || item.id),
      nom: item.nom || item.type || 'Hébergement',
      type: item.typeNormalise || item.type || 'Autre',
      description: item.description || '',
      prixParNuit: Number(item.prixParNuit || 0),
      devise: 'XOF',
      capacite: Number(item.capacite || 1),
      capaciteAdultes: item.capaciteAdultes,
      capaciteEnfants: item.capaciteEnfants,
      photos: item.photos || [],
      equipements: item.equipements || [],
      servicesInclus: item.servicesInclus || [],
      options: item.options || [],
      disponible: Boolean(item.disponible),
      nombreUnites: Number(item.nombreUnites || item.disponibiliteStructurelle || 0),
      unites: item.unites || []
    })),
    capabilities: {
      reservation: categories.length > 0,
      contact: true,
      map: Boolean(hotel.localisation?.latitude && hotel.localisation?.longitude),
      gallery: Boolean((hotel.photos || []).length || hotel.photoHero)
    }
  };
}
