import React from 'react';
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { CartItem, readCart, writeCart } from '../../services/commerce';

const money = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`;

export function Cart() {
  const [items, setItems] = React.useState<CartItem[]>(readCart);
  React.useEffect(() => writeCart(items), [items]);

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const change = (id: string, delta: number) => setItems((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  const remove = (id: string) => setItems((current) => current.filter((item) => item.id !== id));

  return <div className="commerce-page">
    <div className="commerce-heading">
      <div>
        <button className="back-action" onClick={() => history.back()}><ArrowLeft size={16}/> Retour</button>
        <span className="section-eyebrow">Commerce</span>
        <h2>Votre panier</h2>
        <p>Le panier conserve les articles choisis avant l’initialisation réelle du paiement.</p>
      </div>
      <span className="commerce-count">{items.length} article{items.length > 1 ? 's' : ''}</span>
    </div>

    {items.length === 0 ? <div className="commerce-empty">
      <ShoppingBag size={25}/><h3>Votre panier est vide</h3>
      <p>Ajoutez un produit depuis une vitrine Loka pour commencer.</p>
      <a className="button button-secondary" href="/">Revenir à la découverte</a>
    </div> : <div className="cart-layout">
      <section className="commerce-list">
        {items.map((item) => <article className="cart-item" key={item.id}>
          {item.image ? <img src={item.image} alt=""/> : <div className="cart-item-media-placeholder"><ShoppingBag size={20}/></div>}
          <div className="cart-item-main">
            <div><strong>{item.name}</strong><span>{item.seller}</span></div>
            <strong>{money(item.unitPrice * item.quantity)}</strong>
            <div className="cart-item-bottom">
              <div className="quantity"><button onClick={() => change(item.id, -1)}><Minus size={14}/></button><b>{item.quantity}</b><button onClick={() => change(item.id, 1)}><Plus size={14}/></button></div>
              <button className="remove-item" onClick={() => remove(item.id)}><Trash2 size={14}/> Retirer</button>
            </div>
          </div>
        </article>)}
        <div className="delivery-choice"><Truck size={18}/><div><strong>Livraison</strong><span>Elle sera configurée au moment du paiement selon le panier et le mode choisi.</span></div><b>À définir</b></div>
      </section>
      <aside className="order-summary">
        <span className="section-eyebrow">Résumé</span><h3>Commande</h3>
        <div><span>Sous-total</span><b>{money(subtotal)}</b></div>
        <div><span>Livraison</span><b>À définir</b></div>
        <div className="summary-total"><span>Sous-total</span><strong>{money(subtotal)}</strong></div>
        <a className="button button-primary summary-cta" href="/checkout">Continuer</a>
        <p>Le paiement confirmé est distinct de l’exécution et de la livraison de la commande.</p>
      </aside>
    </div>}
  </div>;
}
