import { useEffect, useState } from 'react';
import { ArrowRight, Building2, Hotel, RefreshCw, Store, Truck, Utensils, ExternalLink } from 'lucide-react';
import { getSpaces } from '../../services/professional';

const meta: Record<string, { label:string; icon: typeof Store; href:string; storefront?:boolean }> = {
  vente: { label:'Boutique', icon:Store, href:'/pro/catalogue', storefront:true },
  restauration: { label:'Restaurant', icon:Utensils, href:'/pro/catalogue?espaceType=restauration', storefront:true },
  hotel: { label:'Hôtel', icon:Hotel, href:'/pro/catalogue?espaceType=hotel', storefront:true },
  livraison: { label:'Livreur indépendant', icon:Truck, href:'/pro/livraisons' },
  agence_livraison: { label:'Agence de livraison', icon:Building2, href:'/pro/livraisons/agence' },
  presence: { label:'Professionnel / service local', icon:Building2, href:'/pro/parametres' },
};
const backendType:Record<string,string>={vente:'vente',restauration:'restauration',hotel:'hotel'};
export function ProfessionalOverview(){
  const token=localStorage.getItem('token');
  const [spaces,setSpaces]=useState<any[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const load=async()=>{if(!token){setError('Connectez-vous pour accéder à votre espace professionnel.');setLoading(false);return;}try{setError('');setSpaces(await getSpaces(token));}catch(e){setError(e instanceof Error?e.message:'Impossible de charger vos espaces.');}finally{setLoading(false)}};
  useEffect(()=>{void load()},[]);
  if(loading)return <div className="commerce-empty" role="status"><RefreshCw size={22}/><h3>Chargement de votre espace…</h3></div>;
  return <main className="professional-page">
    <header className="professional-page-head"><div><span className="section-eyebrow">Espace professionnel</span><h2>Vue d’ensemble</h2><p>Choisissez une activité pour accéder à ses outils. Les données affichées proviennent de vos espaces réels.</p></div><button className="button button-secondary" onClick={()=>{setLoading(true);void load()}}><RefreshCw size={15}/> Actualiser</button></header>
    {error&&<div className="commerce-inline-state error" role="alert">{error}</div>}
    {!error&&spaces.length===0?<div className="commerce-empty"><Building2 size={24}/><h3>Aucun espace professionnel trouvé</h3><p>Votre compte n’a pas encore d’activité professionnelle accessible. Vous pourrez créer ou rattacher une activité depuis le parcours d’inscription professionnelle.</p><a className="button button-primary" href="/pro/nouvelle-activite">Créer mon activité <ArrowRight size={15}/></a></div>:<section className="professional-space-grid">{spaces.map((s:any)=>{
      const id=String(s.id||s.data?._id||'');const type=String(s.type||'');const item=meta[type]||{label:'Espace professionnel',icon:Building2,href:'/pro'};const Icon=item.icon;
      const detailHref=`${item.href}${item.href.includes('?')?'&':'?'}espaceId=${encodeURIComponent(id)}&espaceType=${encodeURIComponent(backendType[type]||type)}`;
      const storefrontHref=`/pro/vitrine?espaceId=${encodeURIComponent(id)}&espaceType=${encodeURIComponent(backendType[type]||type)}`;
      const name=s.name||s.data?.nom||item.label;
      return <article className="professional-space-card" key={`${type}-${id}`}><div className="professional-row-icon"><Icon size={19}/></div><span>{item.label}</span><h3>{name}</h3><p>{s.data?.localisation?.ville||s.data?.ville||'Localisation non renseignée'} · Réf. {id.slice(-8)||'—'}</p><div className="professional-space-actions"><a className="button button-primary" href={detailHref}>Gérer <ArrowRight size={15}/></a>{item.storefront&&<a className="button button-secondary" href={storefrontHref}>Vitrine <ExternalLink size={14}/></a>}</div></article>;
    })}</section>}
  </main>;
}
