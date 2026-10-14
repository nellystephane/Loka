import { useState } from 'react';
import { ArrowRight, CreditCard, MapPin, Package, ShoppingBag, Truck, X } from 'lucide-react';
import { Badge, Button, Modal, Sheet } from '../primitives';

export type ProposalKind = 'order' | 'delivery';
export type ProposalStatus = 'pending' | 'accepted' | 'refused' | 'payment_pending' | 'paid';

export type OrderProposalData = {
  kind: 'order';
  product: string;
  quantity: number;
  unitPrice: number;
  deliveryFee: number;
  paymentStatus: 'pending' | 'paid';
};

export type DeliveryProposalData = {
  kind: 'delivery';
  orderRef: string;
  pickup: string;
  destination: string;
  fee: number;
  payer: 'client' | 'merchant';
  paymentTiming: 'now' | 'on_delivery';
};

export type ProposalData = OrderProposalData | DeliveryProposalData;

function money(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
}

function statusLabel(status: ProposalStatus) {
  return ({
    pending: 'À confirmer',
    accepted: 'Acceptée',
    refused: 'Refusée',
    payment_pending: 'Paiement en attente',
    paid: 'Payée',
  } satisfies Record<ProposalStatus, string>)[status];
}

function statusTone(status: ProposalStatus) {
  if (status === 'accepted' || status === 'paid') return 'success' as const;
  if (status === 'refused') return 'error' as const;
  if (status === 'payment_pending') return 'warning' as const;
  return 'info' as const;
}

export function ProposalCard({ data, from = 'them', status = 'pending', onAccept, onRefuse, onPay }: {
  data: ProposalData;
  from?: 'me' | 'them';
  status?: ProposalStatus;
  onAccept?: () => void;
  onRefuse?: () => void;
  onPay?: () => void;
}) {
  const isOrder = data.kind === 'order';
  const total = isOrder ? data.quantity * data.unitPrice + data.deliveryFee : data.fee;

  return <div className={`proposal-card ${from === 'me' ? 'proposal-card-own' : ''}`}>
    <div className="proposal-card-top">
      <div className="proposal-card-heading">
        <span className="proposal-card-icon">{isOrder ? <ShoppingBag size={17} /> : <Truck size={17} />}</span>
        <div><strong>{isOrder ? 'Proposition de commande' : 'Proposition de livraison'}</strong><span>{isOrder ? data.product : `Commande ${data.orderRef}`}</span></div>
      </div>
      <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>
    </div>

    {isOrder ? <div className="proposal-lines">
      <div><span>{data.product} × {data.quantity}</span><strong>{money(data.quantity * data.unitPrice)}</strong></div>
      <div><span>Livraison</span><strong>{data.deliveryFee ? money(data.deliveryFee) : 'Gratuite'}</strong></div>
      <div className="proposal-total"><span>Total</span><strong>{money(total)}</strong></div>
    </div> : <div className="proposal-lines">
      <div><span>Retrait</span><strong>{data.pickup}</strong></div>
      <div><span>Destination</span><strong>{data.destination}</strong></div>
      <div><span>Payeur</span><strong>{data.payer === 'client' ? 'Client' : 'Marchand'}</strong></div>
      <div className="proposal-total"><span>Frais de livraison</span><strong>{money(data.fee)}</strong></div>
    </div>}

    {isOrder && <div className="proposal-payment-row"><CreditCard size={14} /><span>{data.paymentStatus === 'paid' ? 'Paiement confirmé' : 'Paiement requis après acceptation'}</span></div>}
    {!isOrder && <div className="proposal-payment-row"><MapPin size={14} /><span>{data.paymentTiming === 'now' ? 'Paiement prévu maintenant' : 'Paiement prévu à la livraison'}</span></div>}

    {(onAccept || onRefuse || onPay) && status !== 'refused' && status !== 'paid' && <div className="proposal-actions">
      {onRefuse && status === 'pending' && <Button variant="secondary" className="button-sm" onClick={onRefuse}><X size={14} /> Refuser</Button>}
      {onAccept && status === 'pending' && <Button variant="primary" className="button-sm" onClick={onAccept}>Accepter <ArrowRight size={14} /></Button>}
      {onPay && status === 'payment_pending' && <Button variant="primary" className="button-sm" onClick={onPay}><CreditCard size={14} /> Payer</Button>}
    </div>}
  </div>;
}

export function ProposalComposer({ kind, open, onClose, onSubmit, context }: {
  kind: ProposalKind;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProposalData) => void;
  context?: { product?: { name: string; unitPrice: number }; orderRef?: string; pickup?: string; destination?: string };
}) {
  const [quantity, setQuantity] = useState(1);
  const [deliveryFee, setDeliveryFee] = useState(kind === 'order' ? 1500 : 2000);
  const [fee, setFee] = useState(2000);
  const [payer, setPayer] = useState<'client' | 'merchant'>('client');
  const [paymentTiming, setPaymentTiming] = useState<'now' | 'on_delivery'>('now');

  const title = kind === 'order' ? 'Préparer une commande' : 'Préparer une livraison';
  const productName = context?.product?.name || '';
  const unitPrice = Number(context?.product?.unitPrice || 0);
  const orderRef = context?.orderRef || '';
  const pickup = context?.pickup || '';
  const destination = context?.destination || '';
  const submit = () => {
    if (kind === 'order') {
      if (!productName || unitPrice <= 0) return;
      onSubmit({ kind, product: productName, quantity, unitPrice, deliveryFee, paymentStatus: 'pending' });
    } else {
      if (!orderRef || !pickup || !destination) return;
      onSubmit({ kind, orderRef, pickup, destination, fee, payer, paymentTiming });
    }
    onClose();
  };

  const content = kind === 'order' ? <div className="proposal-form">
    <div className="proposal-form-context"><Package size={17} /><div><strong>{productName || 'Produit à sélectionner'}</strong><span>{unitPrice ? `${money(unitPrice)} l’unité` : 'Sélectionnez un produit réel avant de proposer.'}</span></div></div>
    <label>Quantité<input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))} /></label>
    <label>Frais de livraison<input type="number" min={0} value={deliveryFee} onChange={e => setDeliveryFee(Math.max(0, Number(e.target.value) || 0))} /></label>
    <div className="proposal-form-total"><span>Total estimé</span><strong>{money(quantity * unitPrice + deliveryFee)}</strong></div>
    <p className="proposal-form-note">L’acceptation de la proposition crée la commande. Le paiement reste un état séparé.</p>
  </div> : <div className="proposal-form">
    <div className="proposal-form-context"><Truck size={17} /><div><strong>{orderRef || 'Commande à sélectionner'}</strong><span>{pickup && destination ? `${pickup} → ${destination}` : 'La commande et les points de livraison doivent venir du contexte réel.'}</span></div></div>
    <label>Frais de livraison<input type="number" min={0} value={fee} onChange={e => setFee(Math.max(0, Number(e.target.value) || 0))} /></label>
    <label>Qui paie<select value={payer} onChange={e => setPayer(e.target.value as 'client' | 'merchant')}><option value="client">Client</option><option value="merchant">Marchand</option></select></label>
    <label>Moment du paiement<select value={paymentTiming} onChange={e => setPaymentTiming(e.target.value as 'now' | 'on_delivery')}><option value="now">Maintenant</option><option value="on_delivery">À la livraison</option></select></label>
    <div className="proposal-form-total"><span>Frais proposés</span><strong>{money(fee)}</strong></div>
  </div>;

  const footer = <><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit}>{kind === 'order' ? 'Envoyer la commande' : 'Envoyer la proposition'}</Button></>;
  return <>
    <div className="proposal-desktop-only"><Modal open={open} title={title} onClose={onClose} footer={footer}>{content}</Modal></div>
    <div className="proposal-mobile-only"><Sheet open={open} title={title} onClose={onClose}><div>{content}<div className="sheet-actions">{footer}</div></div></Sheet></div>
  </>;
}
