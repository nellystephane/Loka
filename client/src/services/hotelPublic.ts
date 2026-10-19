import { API_BASE } from './apiConfig';
async function req(path:string,options:RequestInit={},fallback='Impossible de communiquer avec Loka.'){const r=await fetch(`${API_BASE}${path}`,options);const b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(b.message||fallback);return b;}
export const getHotelPublic=(id:string)=>req(`/api/hotels/${encodeURIComponent(id)}`);
export const getHotelAvailability=(chambreId:string,dateArrivee:string,dateDepart:string)=>req(`/api/reservations/disponibilite/${chambreId}?dateArrivee=${encodeURIComponent(dateArrivee)}&dateDepart=${encodeURIComponent(dateDepart)}`);
export const initHotelReservation=(payload:Record<string,unknown>,token:string)=>req('/api/reservations/initier-paiement',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(payload)},'Impossible d’initier le paiement de la réservation.');
