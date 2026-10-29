import { API_BASE } from './apiConfig';
const req=async<T>(path:string,token:string,options:RequestInit={})=>{const r=await fetch(`${API_BASE}${path}`,{...options,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`,...(options.headers||{})}});const b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(b.message||'Impossible de communiquer avec Loka.');return b as T};
export const getProfessionalOrders=(token:string)=>Promise.allSettled([req<any[]>('/api/commandes/recues',token),req<any[]>('/api/commandes-restaurant/recues',token)]).then(([b,r])=>({boutique:b.status==='fulfilled'?b.value:[],restaurant:r.status==='fulfilled'?r.value:[]}));
export const getProfessionalFinance=(token:string)=>req<any>('/api/finances/moi',token);
export const getPayoutConfig=(token:string)=>req<any>('/api/payouts/configuration',token);
export const setPayoutConfig=(token:string,payload:any)=>req<any>('/api/payouts/configuration',token,{method:'PUT',body:JSON.stringify(payload)});
export const getProfile=(token:string)=>req<any>('/api/users/profil',token);
export const updateProfile=(token:string,payload:any)=>req<any>('/api/users/profil',token,{method:'PUT',body:JSON.stringify(payload)});
export const getSpaces=(token:string)=>Promise.allSettled([
  req<any>('/api/boutiques/moi',token).then(data=>({type:'vente',raw:data})),
  req<any>('/api/restaurants/moi',token).then(data=>({type:'restauration',raw:data})),
  req<any>('/api/hotels/moi',token).then(data=>({type:'hotel',raw:data})),
  req<any>('/api/livreurs/moi',token).then(data=>({type:'livraison',raw:data})),
  req<any>('/api/agences-livraison/moi',token).then(data=>({type:'agence_livraison',raw:data}))
]).then(xs=>xs.filter(x=>x.status==='fulfilled').map(x=>{
  const value=(x as PromiseFulfilledResult<any>).value; const raw=value.raw;
  const data=raw?.boutique||raw?.restaurant||raw?.hotel||raw?.livreur||raw?.agence||raw?.agenceLivraison||raw;
  const id=String(data?._id||data?.id||'');
  return {type:value.type,id,name:data?.nom||data?.name||data?.raisonSociale||labelSpace(value.type),data};
}).filter(space=>Boolean(space.id)));
function labelSpace(type:string){return ({vente:'Ma boutique',restauration:'Mon restaurant',hotel:'Mon hôtel',livraison:'Mon profil livreur',agence_livraison:'Mon agence de livraison'} as Record<string,string>)[type]||'Mon espace';}

export const getProOffers=(token:string,espaceType:string)=>req<any[]>(`/api/paiements/offres-pro?espaceType=${encodeURIComponent(espaceType)}`,token);
export const getProStatus=(token:string,espaceType:string,espaceId:string)=>req<any>(`/api/paiements/statut-pro?espaceType=${encodeURIComponent(espaceType)}&espaceId=${encodeURIComponent(espaceId)}`,token);
export const initProPayment=(token:string,payload:any)=>req<any>('/api/paiements/pro',token,{method:'POST',body:JSON.stringify(payload)});
