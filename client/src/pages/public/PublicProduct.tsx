import React from 'react';
import { ArrowLeft, MessageCircle, ShoppingBag, Star, Truck } from 'lucide-react';
import { addToCart, getBoutiqueProduct } from '../../services/commerce';
import { trackEvent } from '../../services/analytics';
import { ShareButton } from '../../components/share/ShareButton';

const money = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`;

export function PublicProduct({ productId }: { productId: string }) {
  const [product, setProduct] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [quantity, setQuantity] = React.useState(1);
  const [added, setAdded] = React.useState(false);

  React.useEffect(() => {
    getBoutiqueProduct(productId).then((value) => { setProduct(value); trackEvent('view', 'produit', String(value?._id || productId), { title: value?.nom || '' }); }).catch((e) => setError(e instanceof Error ? e.message : 'Impossible de charger le produit.')).finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <div className="commerce-page"><div className="commerce-empty"><ShoppingBag size={25}/><h3>Chargement du produit…</h3></div></div>;
  if (error || !product) return <div className="commerce-page"><div className="commerce-empty"><h3>{error || 'Produit introuvable'}</h3><a className="button button-secondary" href="/">Retour</a></div></div>;

  const boutique = product.boutique;
  const image = product.photos?.[0] || '';
  function add() {
    addToCart({ id: `boutique:${product._id}`, type:'boutique', produitId:product._id, boutiqueId:boutique?._id, name:product.nom, seller:boutique?.nom || 'Boutique Loka', unitPrice:product.prix, quantity, image, variant:'' });
    trackEvent('cart', 'produit', String(product._id), { quantity, boutiqueId: boutique?._id });
    setAdded(true);
  }

  return <div className="public-detail-page">
    <div className="detail-topbar"><button className="back-action" onClick={() => history.back()}><ArrowLeft size={17}/> Retour</button><span className="secure-label">{product.quantiteDisponible > 0 && product.statut !== 'rupture' ? 'Produit disponible' : 'Produit indisponible'}</span></div>
    <div className="detail-grid">
      <div className="detail-main-media">{image ? <img src={image} alt={product.nom} style={{width:'100%',height:'100%',minHeight:520,objectFit:'cover',borderRadius:22}}/> : <div className="commerce-empty" style={{minHeight:520}}><ShoppingBag size={28}/></div>}</div>
      <aside className="detail-summary"><span className="detail-kind">Produit</span><h2>{product.nom}</h2><p className="detail-subtitle">{boutique?.nom || 'Boutique Loka'}</p>{product.estMisEnAvant && <div className="detail-rating"><Star size={16} fill="currentColor"/><strong>Mis en avant</strong></div>}<div className="detail-price">{money(product.prix)}</div><p className="detail-description">{product.description || 'Aucune description supplémentaire.'}</p><div className="detail-trust"><span><Truck size={15}/> Livraison selon les conditions de la boutique</span><span><ShoppingBag size={15}/> Panier Loka</span></div><div className="product-quickview-specs" style={{marginTop:18}}><div><span>Stock</span><strong>{product.quantiteDisponible} disponible(s)</strong></div><div><span>État</span><strong>{product.etat || 'neuf'}</strong></div><div><span>Catégorie</span><strong>{product.categorie || '—'}</strong></div></div><div className="detail-primary-actions"><div className="quantity"><button onClick={() => setQuantity(Math.max(1,quantity-1))}>−</button><b>{quantity}</b><button onClick={() => setQuantity(quantity+1)}>+</button></div><button className="button button-primary" onClick={add} disabled={!product.quantiteDisponible || product.statut === 'rupture'}><ShoppingBag size={17}/> {added ? 'Ajouté au panier' : product.quantiteDisponible > 0 && product.statut !== 'rupture' ? 'Ajouter au panier' : 'Indisponible'}</button><ShareButton title={product.nom || 'Produit Loka'} text={product.description || ''} cibleType="produit" cibleId={String(product._id)} /></div>{added && <p className="checkout-note">Produit ajouté au panier. Vous pouvez continuer à découvrir ou passer au paiement.</p>} </aside>
    </div>
  </div>;
}
