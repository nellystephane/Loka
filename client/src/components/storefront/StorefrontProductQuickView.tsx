import { useEffect, useState } from 'react';
import { addToCart } from '../../services/commerce';
import { Check, Heart, Minus, Plus, X } from 'lucide-react';

export type StorefrontProduct = {
  id: string;
  name: string;
  category: string;
  price: string;
  image: string;
  alt: string;
  description: string;
  colors: string[];
  sizes: string[];
  details: { label: string; value: string }[];
  ingredients?: string[];
  commerceType?: 'boutique' | 'restaurant';
  produitId?: string;
  platId?: string;
  boutiqueId?: string;
  restaurantId?: string;
  seller?: string;
  unitPrice?: number;
  available?: boolean;
};

export function StorefrontProductQuickView({
  product,
  open,
  onClose,
  theme = 'neutral',
  preview = false,
}: {
  product: StorefrontProduct | null;
  open: boolean;
  onClose: () => void;
  theme?: 'neutral' | 'popobject' | 'spectrum' | 'editorial' | 'neoflux' | 'orbit' | 'floatform' | 'prismvault' | 'kineticatelier' | 'restauranttempo';
  preview?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const [quantity, setQuantity] = useState(1);
  if (!open || !product) return null;
  const canCart = Boolean(product.available !== false && product.commerceType && (product.produitId || product.platId));
  const price = Number(product.unitPrice || 0);
  const add = () => {
    if (!canCart || !product) return;
    addToCart({ id: product.id, type: product.commerceType!, produitId: product.produitId, platId: product.platId, boutiqueId: product.boutiqueId, restaurantId: product.restaurantId, name: product.name, seller: product.seller || '', unitPrice: price, quantity, image: product.image });
    onClose();
  };

  return (
    <div className={`product-quickview product-quickview-${theme}`} role="dialog" aria-modal="true" aria-label={`Détails de ${product.name}`}>
      <button className="product-quickview-backdrop" aria-label="Fermer" onClick={onClose} />
      <section className="product-quickview-panel">
        <button className="product-quickview-close" aria-label="Fermer" onClick={onClose}><X size={20} /></button>
        <div className="product-quickview-media">
          <img src={product.image} alt={product.alt} />
          <span>{product.category}</span>
        </div>
        <div className="product-quickview-content">
          <div className="product-quickview-heading">
            <div><span className="product-quickview-kicker">ARTICLE · {product.id}</span><h2>{product.name}</h2></div>
            <strong>{product.price}</strong>
          </div>
          <p className="product-quickview-description">{product.description}</p>

          <div className="product-quickview-block">
            <span>COULEUR</span>
            <div className="product-quickview-swatches">
              {product.colors.map((color) => <button key={color} title={color} aria-label={color} style={{ background: color }} />)}
            </div>
          </div>

          {product.sizes.length > 0 && <div className="product-quickview-block">
            <span>TAILLE / FORMAT</span>
            <div className="product-quickview-sizes">{product.sizes.map((size) => <button key={size}>{size}</button>)}</div>
          </div>}

          {product.ingredients && product.ingredients.length > 0 && <div className="product-quickview-block">
            <span>INGRÉDIENTS</span>
            <div className="product-quickview-tags">{product.ingredients.map((ingredient) => <span key={ingredient}>{ingredient}</span>)}</div>
          </div>}

          <div className="product-quickview-specs">
            {product.details.map((detail) => <div key={detail.label}><span>{detail.label}</span><strong>{detail.value}</strong></div>)}
          </div>

          {!preview && <div className="product-quickview-actions">
            <button className="product-quickview-favorite" aria-label="Ajouter aux favoris"><Heart size={18} /></button>
            <div className="product-quickview-cart"><button type="button" aria-label="Diminuer" disabled={!canCart} onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={15} /></button><span>{quantity}</span><button type="button" aria-label="Augmenter" disabled={!canCart} onClick={() => setQuantity(quantity + 1)}><Plus size={15} /></button></div>
            <button className="product-quickview-primary" disabled={!canCart} onClick={add}><Check size={17} /> {canCart ? 'Ajouter au panier' : product.available === false ? 'Indisponible' : 'Informations uniquement'}</button>{product.commerceType==='restaurant' && canCart && <button className="button button-secondary" onClick={() => { add(); window.location.assign('/checkout'); }}>Commander maintenant</button>}
          </div>}
        </div>
      </section>
    </div>
  );
}
