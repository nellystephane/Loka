import React from 'react';
import { ArrowLeft, CheckCircle2, Clock3, PackageCheck, Truck } from 'lucide-react';
import { getMyBoutiqueOrders, getMyRestaurantOrders } from '../../services/commerce';

const stepsBoutique = ['confirmée', 'préparation', 'expédiée', 'en_livraison', 'livrée', 'terminée'];
const stepsRestaurant = ['confirmée', 'en_préparation', 'prête', 'en_livraison', 'livrée', 'terminée'];
const labels: Record<string, string> = { en_attente: 'En attente', confirmée: 'Confirmée', préparation: 'Préparation', 'en_préparation': 'Préparation', prête: 'Prête', expédiée: 'Remise au transport', en_livraison: 'En livraison', livrée: 'Livrée', terminée: 'Terminée', annulée: 'Annulée' };
const money = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`;

export function Order() {
  const id = window.location.pathname.split('/').filter(Boolean).pop() || '';
  const [order, setOrder] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const token = window.localStorage.getItem('token');
    if (!token) { setError('Connectez-vous pour consulter cette commande.'); setLoading(false); return; }
    Promise.all([getMyBoutiqueOrders(token), getMyRestaurantOrders(token)]).then(([boutiques, restaurants]) => {
      const all = [...boutiques.map((item) => ({ ...item, _type: 'boutique' })), ...restaurants.map((item) => ({ ...item, _type: 'restaurant' }))];
      const found = all.find((item) => item._id === id || item.reference === id);
      if (!found) setError('Commande introuvable dans votre espace client.');
      else setOrder(found);
    }).catch((e) => setError(e instanceof Error ? e.message : 'Impossible de charger la commande.')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="commerce-page"><div className="commerce-empty"><Clock3 size={25}/><h3>Chargement de la commande…</h3></div></div>;
  if (error || !order) return <div className="commerce-page"><div className="commerce-empty"><PackageCheck size={25}/><h3>{error || 'Commande introuvable'}</h3><a className="button button-secondary" href="/">Retour</a></div></div>;

  const steps = order._type === 'restaurant' ? stepsRestaurant : stepsBoutique;
  const active = Math.max(0, steps.indexOf(order.statut));
  const name = order._type === 'restaurant' ? order.restaurant?.nom : order.boutique?.nom;
  const title = order.articles?.map((a: any) => `${a.nom} × ${a.quantite}`).join(' · ');

  return <div className="order-page motion-enter"><button className="back-action" onClick={() => history.back()}><ArrowLeft size={16}/> Retour</button>
    <div className="order-header"><div><span className="section-eyebrow">Commande</span><h2>{order.reference || order._id}</h2><p>{name || 'Espace professionnel'} · {title || 'Articles'}</p></div><span className={`badge motion-status ${['livrée','terminée'].includes(order.statut) ? 'badge-success' : 'badge-info'}`}>{labels[order.statut] || order.statut}</span></div>
    <div className="order-grid"><section className="order-timeline"><div className="order-card-title"><div><span className="section-eyebrow">Progression métier</span><h3>Votre commande</h3></div><Truck size={20}/></div>{steps.map((step, index) => <div className={`timeline-step ${index <= active ? 'done' : ''} ${index === active ? 'current' : ''}`} key={step}><div className="timeline-marker">{index < active ? <CheckCircle2 size={15}/> : index === active ? <Clock3 size={15}/> : <span/>}</div><div><strong>{labels[step] || step}</strong><p>{index === active ? 'État actuel confirmé par le serveur.' : index < active ? 'Étape déjà franchie.' : 'Étape à venir.'}</p></div></div>)}</section>
      <aside className="order-side"><div className="order-side-block"><PackageCheck size={20}/><div><strong>Montant</strong><p>{money(order.montantTotal || 0)}</p></div></div><div className="order-side-block"><span className="section-eyebrow">Paiement</span><strong>Confirmé avant la création de cette commande</strong><p>Le paiement et l’exécution commerciale restent deux états distincts.</p></div>{order.livraison && <div className="order-side-actions"><a className="button button-primary" href={`/livraison/${order.livraison}`}>Suivre la livraison</a><a className="button button-secondary" href="/messages">Ouvrir la conversation</a></div>}</aside>
    </div>
  </div>;
}
