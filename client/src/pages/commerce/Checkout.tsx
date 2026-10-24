import React from 'react';
import { ArrowLeft, CreditCard, MapPin, ShieldCheck, Smartphone, Truck } from 'lucide-react';
import { CartItem, getPaymentStatus, initiatePayment, readCart, writeCart, clearCart, AdresseLivraison } from '../../services/commerce';
import { appPath } from '../../utils/navigation';

const money = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`;

function buildContext(items: CartItem[], address: AdresseLivraison | null) {
  const boutiques = new Map<string, CartItem[]>();
  const restaurants = new Map<string, CartItem[]>();
  for (const item of items) {
    if (item.type === 'boutique' && item.boutiqueId && item.produitId) {
      const list = boutiques.get(item.boutiqueId) || [];
      list.push(item); boutiques.set(item.boutiqueId, list);
    }
    if (item.type === 'restaurant' && item.restaurantId && item.platId) {
      const list = restaurants.get(item.restaurantId) || [];
      list.push(item); restaurants.set(item.restaurantId, list);
    }
  }
  const groups: any[] = [];
  boutiques.forEach((group, boutiqueId) => groups.push({
    type: 'boutique', boutiqueId,
    articles: group.map((item) => ({ produitId: item.produitId, quantite: item.quantity, varianteChoisie: item.variant || '' })),
    livraisonDemandee: !!address,
    adresseLivraison: address || {},
    fraisLivraison: 0,
    priseEnChargeLivraison: 'client',
  }));
  restaurants.forEach((group, restaurantId) => groups.push({
    type: 'restaurant', restaurantId,
    articles: group.map((item) => ({ platId: item.platId, quantite: item.quantity })),
    modeService: address ? 'livraison' : 'a_emporter',
    adresseLivraison: address || {},
    fraisLivraison: 0,
    priseEnChargeLivraison: 'client',
  }));
  if (groups.length === 0) throw new Error('Le panier ne contient aucun article raccordé à un espace Loka réel.');
  return { type: groups.length === 1 ? (groups[0].type === 'boutique' ? 'panier_boutique' : 'panier_restaurant') : 'panier_multi', panier: groups.length === 1 ? groups[0] : { groupes: groups } };
}

export function Checkout() {
  const [items, setItems] = React.useState<CartItem[]>(readCart);
  const [delivery, setDelivery] = React.useState(false);
  const [address, setAddress] = React.useState<AdresseLivraison>({ details: '', ville: '', quartier: '' });
  const [status, setStatus] = React.useState<'idle' | 'opening' | 'pending' | 'success' | 'error'>('idle');
  const [message, setMessage] = React.useState('');
  const [transactionId, setTransactionId] = React.useState<string | null>(null);

  React.useEffect(() => setItems(readCart()), []);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  React.useEffect(() => {
    if (!transactionId || status !== 'pending') return;
    const token = window.localStorage.getItem('token');
    if (!token) return;
    let stopped = false;
    const startedAt = Date.now();
    let timer: number | undefined;
    const poll = async () => {
      if (Date.now() - startedAt > 5 * 60 * 1000) {
        if (!stopped) { setStatus('error'); setMessage('La confirmation prend plus de temps que prévu. Vérifiez le statut dans vos commandes avant de réessayer, afin d’éviter un double paiement.'); }
        return;
      }
      try {
        const result = await getPaymentStatus(token, transactionId);
        if (stopped) return;
        if (result.transaction.statut === 'approuvé') {
          clearCart();
          setStatus('success');
          if (result.commandes.length) window.location.assign(appPath(`/commande/${result.commandes[0].id}`));
          return;
        }
        if (['échoué', 'expiré'].includes(result.transaction.statut)) {
          setStatus('error');
          setMessage('Le paiement n’a pas été confirmé. Aucun succès de commande n’est affiché.');
          return;
        }
        timer = window.setTimeout(poll, 2500);
      } catch {
        if (!stopped) timer = window.setTimeout(poll, 4000);
      }
    };
    poll();
    return () => { stopped = true; if (timer) window.clearTimeout(timer); };
  }, [transactionId, status]);

  async function startPayment() {
    const token = window.localStorage.getItem('token');
    if (!token) { setStatus('error'); setMessage('Connectez-vous pour payer une commande.'); return; }
    if (!items.length) { setStatus('error'); setMessage('Votre panier est vide.'); return; }
    if (delivery && !address.details.trim()) { setStatus('error'); setMessage('Décrivez précisément comment trouver votre lieu de livraison.'); return; }
    if (delivery) { setStatus('error'); setMessage('Les frais de livraison ne sont pas encore calculés par Loka. Pour éviter un montant incomplet, choisissez le retrait / sans livraison ou attendez que le tarif soit confirmé.'); return; }
    const paymentWindow = window.open('about:blank', '_blank');
    try {
      setStatus('opening'); setMessage('Initialisation sécurisée du paiement…');
      const context = buildContext(items, delivery ? address : null);
      const result = await initiatePayment(token, context);
      setTransactionId(result.transactionId);
      setStatus('pending');
      setMessage('Le paiement est en attente de confirmation. Ne fermez pas cette page : Loka vérifiera le statut auprès du serveur.');
      if (paymentWindow) { paymentWindow.opener = null; paymentWindow.location.href = result.lienPaiement; }
      else window.location.assign(result.lienPaiement);
    } catch (error) {
      if (paymentWindow && !paymentWindow.closed) paymentWindow.close();
      setStatus('error'); setMessage(error instanceof Error ? error.message : 'Impossible d’initialiser le paiement.');
    }
  }

  if (status === 'success') return <div className="commerce-page"><div className="commerce-success motion-success"><div className="success-orb"><ShieldCheck size={28}/></div><span className="section-eyebrow">Paiement confirmé</span><h2>La commande est maintenant enregistrée.</h2><p>La confirmation affichée ici provient du statut serveur. Le vendeur doit encore traiter la commande et la livraison suit son propre cycle.</p><div className="success-actions"><a className="button button-primary" href={window.location.pathname}>Rafraîchir</a><a className="button button-secondary" href={appPath('/')}>Continuer</a></div></div></div>;

  return <div className="commerce-page">
    <div className="commerce-heading"><div><button className="back-action" onClick={() => history.back()}><ArrowLeft size={16}/> Retour</button><span className="section-eyebrow">Paiement</span><h2>Finaliser la commande</h2><p>Le frontend initialise seulement le paiement. La commande naît après confirmation FedaPay côté serveur.</p></div><span className="secure-label"><ShieldCheck size={13}/> Sécurisé</span></div>
    <div className="checkout-layout">
      <main className="checkout-main">
        <section className="checkout-section"><div className="checkout-section-title"><div><span>01</span><div><h3>Livraison</h3><p>La description humaine du lieu reste obligatoire.</p></div></div></div>
          <label className="delivery-option"><Truck size={19}/><div><strong>{delivery ? 'Livraison demandée' : 'Retrait / sans livraison'}</strong><span>{delivery ? 'Vous renseignerez le lieu juste dessous.' : 'Aucune adresse de livraison ne sera transmise.'}</span></div><input type="checkbox" checked={delivery} onChange={(e) => setDelivery(e.target.checked)}/></label>
          {delivery && <div className="checkout-field" style={{marginTop:12}}><span>Comment trouver le lieu ?</span><textarea value={address.details} onChange={(e) => setAddress({...address, details:e.target.value})} placeholder="Ex. après la pharmacie…, deuxième von à droite…, portail bleu…"/><div className="location-row"><MapPin size={14}/><span>Ville : <input value={address.ville || ''} onChange={(e) => setAddress({...address, ville:e.target.value})} placeholder="Ville"/> · Quartier : <input value={address.quartier || ''} onChange={(e) => setAddress({...address, quartier:e.target.value})} placeholder="Quartier"/></span></div></div>}
        </section>
        <section className="checkout-section"><div className="checkout-section-title"><div><span>02</span><div><h3>Moyen de paiement</h3><p>Le moyen choisi sera présenté par l’interface de paiement.</p></div></div></div>
          <div className="checkout-payment-provider-note"><div className="payment-choice-icon mobile"><Smartphone size={19}/></div><div><strong>Moyens disponibles dans la fenêtre FedaPay</strong><span>Les moyens réellement proposés dépendent de la configuration du prestataire. Loka ne prétend pas sélectionner un moyen qui n’est pas transmis au serveur.</span></div></div>
          <p className="checkout-note"><ShieldCheck size={14}/> Loka ne stocke ni PIN, ni OTP, ni données sensibles de carte.</p>
        </section>
        {message && <div className={`commerce-inline-state ${status === 'error' ? 'error' : ''}`}>{message}</div>}
      </main>
      <aside className="order-summary checkout-summary"><span className="section-eyebrow">À payer</span><h3>Votre commande</h3>{items.map(i => <div key={i.id}><span>{i.name} × {i.quantity}</span><b>{money(i.unitPrice * i.quantity)}</b></div>)}<div className="summary-total"><span>Total produits</span><strong>{money(subtotal)}</strong></div><button className="button button-primary summary-cta" onClick={startPayment} disabled={status === 'opening' || status === 'pending' || delivery}>{status === 'opening' ? 'Initialisation…' : status === 'pending' ? 'Paiement en attente…' : `Payer · ${money(subtotal)}`}</button><div className="checkout-trust"><ShieldCheck size={15}/><span>La réussite affichée dépend uniquement de la confirmation backend/webhook.</span></div>{delivery && <p className="commerce-inline-state error" role="status">Livraison indisponible au paiement tant qu’un tarif réel n’a pas été calculé.</p>}</aside>
    </div>
  </div>;
}
