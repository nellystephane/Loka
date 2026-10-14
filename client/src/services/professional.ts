const API_BASE=(import.meta.env.VITE_API_URL as string|undefined)?.replace(/\/$/,'')||'';
const req = async <T,>(path:string,token:string,options:RequestInit={})=>{const r=await fetch(`${API_BASE}${path}`,{...options,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`,...(options.headers||{})}});const b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(b.message||'Impossible de communiquer avec Loka.');return b as T};
export const getProfessionalOrders=async(token:string)=>{
  const sources=[
    {key:'boutique',label:'commandes boutique',path:'/api/commandes/recues'},
    {key:'restaurant',label:'commandes restaurant',path:'/api/commandes-restaurant/recues'}
  ] as const;
  const results=await Promise.allSettled(sources.map(source=>req<any[]>(source.path,token)));
  const data:any={boutique:[],restaurant:[],failedSources:[] as string[]};
  results.forEach((result,index)=>{
    const source=sources[index];
    if(result.status==='fulfilled') data[source.key]=Array.isArray(result.value)?result.value:[];
    else data.failedSources.push(source.label);
  });
  if(data.failedSources.length===sources.length) throw new Error('Les commandes boutique et restaurant sont temporairement indisponibles. Réessayez.');
  return data;
};
export const getProfessionalFinance=(token:string)=>req<any>('/api/finances/moi',token);
export const getPayoutConfig=(token:string)=>req<any>('/api/payouts/configuration',token);
export const setPayoutConfig=(token:string,payload:any)=>req<any>('/api/payouts/configuration',token,{method:'PUT',body:JSON.stringify(payload)});
export const getProfile=(token:string)=>req<any>('/api/users/profil',token);
export const updateProfile=(token:string,payload:any)=>req<any>('/api/users/profil',token,{method:'PUT',body:JSON.stringify(payload)});
export const getSpaces=(token:string)=>Promise.allSettled([req<any>('/api/boutiques/moi',token).then(data=>({type:'vente',data})),req<any>('/api/restaurants/moi',token).then(data=>({type:'restauration',data})),req<any>('/api/hotels/moi',token).then(data=>({type:'hotel',data})),req<any>('/api/livreurs/moi',token).then(data=>({type:'livraison',data})),req<any>('/api/agences-livraison/moi',token).then(data=>({type:'agence_livraison',data})),req<any>('/api/presence-professionnelle/moi',token).then(data=>({type:'presence',data}))]).then(xs=>xs.filter(x=>x.status==='fulfilled').map(x=>(x as PromiseFulfilledResult<any>).value));
export const getProOffers=(token:string,espaceType:string)=>req<any[]>(`/api/paiements/offres-pro?espaceType=${encodeURIComponent(espaceType)}`,token);
export const getProStatus=(token:string,espaceType:string,espaceId:string)=>req<any>(`/api/paiements/statut-pro?espaceType=${encodeURIComponent(espaceType)}&espaceId=${encodeURIComponent(espaceId)}`,token);
export const initProPayment=(token:string,payload:any)=>req<any>('/api/paiements/pro',token,{method:'POST',body:JSON.stringify(payload)});
