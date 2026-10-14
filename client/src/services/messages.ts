const API_BASE=(import.meta.env.VITE_API_URL as string|undefined)?.replace(/\/$/,'')||'';
async function req<T>(path:string,options:RequestInit={},fallback='Impossible de communiquer avec la messagerie.'){const r=await fetch(`${API_BASE}${path}`,options);const b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(b.message||fallback);return b as T;}
const auth=(token:string)=>({ 'Content-Type':'application/json', Authorization:`Bearer ${token}` });
export const getConversations=(token:string)=>req<any[]>('/api/conversations',{headers:{Authorization:`Bearer ${token}`}},'Impossible de charger les conversations.');
export const createConversation=(destinataireId:string,contexte:any,token:string)=>req<any>('/api/conversations',{method:'POST',headers:auth(token),body:JSON.stringify({destinataireId,contexte})},'Impossible d’ouvrir la conversation.');
export const getMessages=(id:string,token:string)=>req<any[]>(`/api/conversations/${id}/messages`,{headers:{Authorization:`Bearer ${token}`}},'Impossible de charger les messages.');
export const sendMessage=(id:string,contenu:string,token:string,pieceJointe?:{url:string;nom?:string;type?:string;taille?:number})=>req<any>(`/api/conversations/${id}/messages`,{method:'POST',headers:auth(token),body:JSON.stringify({contenu,pieceJointe})},'Impossible d’envoyer le message.');
export const uploadMessageAttachment=async(file:File,token:string)=>{const data=new FormData();data.append('fichier',file);return req<{url:string;nom:string;type:string;taille:number}>('/api/upload/piece-jointe',{method:'POST',headers:{Authorization:`Bearer ${token}`},body:data},'Impossible de téléverser ce fichier.');};

export const refuseOffer=(id:string,token:string)=>req<any>(`/api/offres/${id}/reponse`,{method:'PUT',headers:auth(token),body:JSON.stringify({reponse:'refusée'})},'Impossible de refuser la proposition.');
export const acceptDeliveryOffer=(id:string,token:string)=>req<any>(`/api/offres-livraison/${id}/accepter`,{method:'PUT',headers:auth(token)},'Impossible d’accepter la proposition de livraison.');
export const refuseDeliveryOffer=(id:string,token:string)=>req<any>(`/api/offres-livraison/${id}/refuser`,{method:'PUT',headers:auth(token)},'Impossible de refuser la proposition de livraison.');
