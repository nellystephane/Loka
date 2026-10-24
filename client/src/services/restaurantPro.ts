import { API_BASE } from './apiConfig';
async function req<T>(path:string,options:RequestInit={},fallback='Impossible de communiquer avec Loka.'){const r=await fetch(`${API_BASE}${path}`,options);const b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(b.message||fallback);return b as T;}
export const getRestaurantReservations=(token:string)=>req<any[]>('/api/restaurants/reservations/recues',{headers:{Authorization:`Bearer ${token}`}},'Impossible de charger les réservations.');
export const updateRestaurantReservationStatus=(id:string,statut:string,token:string)=>req<any>(`/api/restaurants/reservations/${id}/statut`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({statut})},'Transition de réservation impossible.');
