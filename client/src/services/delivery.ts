const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';
async function request<T>(path: string, options: RequestInit = {}, fallback = 'Impossible de communiquer avec Loka.') { const r=await fetch(`${API_BASE}${path}`,options); const b=await r.json().catch(()=>({})); if(!r.ok) throw new Error(b.message||fallback); return b as T; }
const auth=(token:string)=>({ 'Content-Type':'application/json', Authorization:`Bearer ${token}` });
export const getMyDeliveries=(token:string)=>request<any[]>('/api/demandes-livraison/mes-livraisons',{headers:{Authorization:`Bearer ${token}`}},'Impossible de charger vos livraisons.');
export const getMyDeliveryRequests=(token:string)=>request<any[]>('/api/demandes-livraison/mes-demandes',{headers:{Authorization:`Bearer ${token}`}},'Impossible de charger les demandes de livraison.');
export const getDelivery=(id:string,token:string)=>request<any>(`/api/demandes-livraison/${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${token}`}},'Livraison introuvable.');
export const acceptDelivery=(id:string,token:string)=>request<any>(`/api/demandes-livraison/${id}/accepter`,{method:'PUT',headers:auth(token)},'Impossible d’accepter la livraison.');
export const updateDeliveryStatus=(id:string,statut:string,token:string)=>request<any>(`/api/demandes-livraison/${id}/statut`,{method:'PUT',headers:auth(token),body:JSON.stringify({statut})},'Impossible de mettre à jour la livraison.');
export const validatePickup=(id:string,code:string,token:string)=>request<any>(`/api/demandes-livraison/${id}/recuperation`,{method:'PUT',headers:auth(token),body:JSON.stringify({code})},'Code de récupération invalide.');
export const validateDelivery=(id:string,code:string,token:string,preuve?:unknown)=>request<any>(`/api/demandes-livraison/${id}/livraison`,{method:'PUT',headers:auth(token),body:JSON.stringify({code,preuve})},'Code de remise invalide.');

export const getAgencyProfile=(token:string)=>request<any>('/api/agences-livraison/moi',{headers:{Authorization:`Bearer ${token}`}},'Impossible de charger l’agence.');
export const getAgencyRequests=(token:string)=>request<any[]>('/api/agences-livraison/moi/demandes',{headers:{Authorization:`Bearer ${token}`}},'Impossible de charger les missions de l’agence.');
export const assignAgencyCourier=(id:string,livreurId:string,token:string)=>request<any>(`/api/agences-livraison/moi/demandes/${id}/affecter`,{method:'PUT',headers:auth(token),body:JSON.stringify({livreurId})},'Impossible d’affecter ce livreur.');

export const searchAgencyCourierCandidates=(q:string,token:string)=>request<any>(`/api/agences-livraison/moi/livreurs/candidats?q=${encodeURIComponent(q)}`,{headers:auth(token)},'Impossible de rechercher les livreurs.');
export const addAgencyCourier=(livreurId:string,token:string)=>request<any>('/api/agences-livraison/moi/livreurs',{method:'POST',headers:auth(token),body:JSON.stringify({livreurId})},'Impossible de rattacher ce livreur.');
