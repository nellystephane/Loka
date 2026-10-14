import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowRight, ArrowUpRight, Heart, MapPin, Menu, Search, ShoppingBag } from 'lucide-react';
import { publicItems } from '../../data/demo';
import { StorefrontProductQuickView, type StorefrontProduct } from './StorefrontProductQuickView';

export function BoutiquePrismVaultTemplate({ preview = false, accent = '#D9A8FF' }: { preview?: boolean; accent?: string }) {
  const item = publicItems.shop;
  const [selected, setSelected] = useState<StorefrontProduct | null>(null);

  const products: StorefrontProduct[] = [
    {
      id: 'PV-01', name: 'Soft Structure', category: 'OUTERWEAR', price: '58 000 FCFA', image: item.media[1].src, alt: item.media[1].alt,
      description: 'Une pièce structurée aux lignes douces, pensée comme le point focal d’une silhouette.',
      colors: ['#C9B4A4', '#3B3147', '#D9A8FF'], sizes: ['S', 'M', 'L', 'XL'],
      details: [{ label: 'Matière', value: 'Textile mixte' }, { label: 'Disponibilité', value: 'En stock' }, { label: 'Édition', value: 'Automne 2026' }]
    },
    {
      id: 'PV-02', name: 'Night Layer', category: 'COLLECTION', price: '42 000 FCFA', image: item.media[0].src, alt: item.media[0].alt,
      description: 'Une silhouette plus sombre, conçue pour fonctionner seule ou en superposition.',
      colors: ['#17132A', '#5D536F', '#E7D8EF'], sizes: ['M', 'L'],
      details: [{ label: 'Matière', value: 'Coton & textile' }, { label: 'Disponibilité', value: 'En stock' }, { label: 'Coupe', value: 'Regular' }]
    },
    {
      id: 'PV-03', name: 'Lavender Signal', category: 'LIMITED', price: '36 000 FCFA', image: item.media[1].src, alt: item.media[1].alt,
      description: 'Une pièce plus expressive qui apporte une note lumineuse à la collection.',
      colors: ['#D9A8FF', '#8D5DB5', '#F5EAF9'], sizes: ['S', 'M', 'L'],
      details: [{ label: 'Matière', value: 'Maille souple' }, { label: 'Disponibilité', value: 'Dernières pièces' }, { label: 'Édition', value: 'Limited' }]
    },
  ];

  return (
    <div className="prism-vault-template" style={{ '--prism-accent': accent || '#D9A8FF' } as CSSProperties}>
      <div className="prism-vault-shell">
        <header className="prism-vault-nav">
          <button className="prism-vault-menu" aria-label="Menu"><Menu size={18} /></button>
          <a href="#prism-top" className="prism-vault-brand"><span>MN</span><strong>MAISON NAYA</strong></a>
          <nav><a href="#prism-edit">EDIT</a><a href="#prism-house">HOUSE</a><a href="#prism-visit">VISIT</a></nav>
          <div className="prism-vault-actions">
            <button aria-label="Rechercher"><Search size={17} /></button>
            <button aria-label="Panier"><ShoppingBag size={17} /></button>
            {!preview && <button aria-label="Favoris"><Heart size={17} /></button>}
          </div>
        </header>

        <main>
          <section className="prism-vault-hero" id="prism-top">
            <div className="prism-plane prism-plane-one" />
            <div className="prism-plane prism-plane-two" />
            <div className="prism-plane prism-plane-three" />

            <div className="prism-vault-hero-meta"><span>MAISON NAYA / COTONOU</span><span>OBJECTS / 026</span></div>

            <div className="prism-vault-hero-copy">
              <span className="prism-kicker">THE NEW SEASON / 01</span>
              <h1>FORM<br /><em>IN MOTION.</em></h1>
              <p>Une vitrine construite comme un objet architectural : volumes, matières, couleurs et produits dans une même composition.</p>
              <a href="#prism-edit" className="prism-vault-hero-link">EXPLORE THE EDIT <ArrowRight size={16} /></a>
            </div>

            <div className="prism-vault-rack" aria-label="Sélection de produits">
              <div className="prism-hanger prism-hanger-a"><span /><img src={item.media[1].src} alt="Collection de mode" /></div>
              <div className="prism-hanger prism-hanger-b"><span /><img src={item.media[0].src} alt="Intérieur de boutique" /></div>
              <div className="prism-hanger prism-hanger-c"><span /><img src={item.media[1].src} alt="Pièce de collection" /></div>
              <div className="prism-rack-frame" />
            </div>

            <div className="prism-vault-side-note"><span>SCULPTED</span><strong>LOCAL<br />OBJECTS</strong></div>
          </section>

          <section className="prism-vault-edit" id="prism-edit">
            <div className="prism-section-head">
              <div><span>02 / CURRENT EDIT</span><h2>SELECTED<br /><em>FORMS.</em></h2></div>
              <p>Le catalogue reste connecté au moteur Boutique de Loka : catégories, variantes, disponibilité et données produit sont réutilisés automatiquement dans cette composition.</p>
            </div>

            <div className="prism-product-stage">
              {products.map((product, index) => (
                <button key={product.id} className={`prism-product-card prism-product-card-${index + 1}`} onClick={() => setSelected(product)} aria-label={`Voir ${product.name}`}>
                  <div className="prism-product-image"><img src={product.image} alt={product.alt} /><span>0{index + 1}</span></div>
                  <div className="prism-product-info"><div><strong>{product.name}</strong><small>{product.category}</small></div><span>{product.price}</span><ArrowUpRight size={16} /></div>
                </button>
              ))}
            </div>
          </section>

          <section className="prism-vault-house" id="prism-house">
            <div className="prism-house-visual">
              <div className="prism-house-glow" />
              <img src={item.media[0].src} alt="Maison Naya" />
              <span className="prism-vertical-label">MAISON / NAYA / COTONOU</span>
              <span className="prism-house-number">03</span>
            </div>
            <div className="prism-house-copy">
              <span>03 / THE HOUSE</span>
              <h2>A SHOP<br /><em>WITH A SHAPE.</em></h2>
              <p>{item.description}</p>
              <div className="prism-facts"><span><b>4.8</b> NOTE</span><span><b>126</b> AVIS</span><span><b>08—20</b> OUVERT</span></div>
              <a href="#prism-visit">Discover the house <ArrowUpRight size={16} /></a>
            </div>
          </section>

          <section className="prism-vault-specimen">
            <div className="prism-specimen-copy"><span>04 / MATERIAL STUDY</span><h2>DETAIL<br /><em>MATTERS.</em></h2><p>La vitrine peut exploiter les attributs renseignés par la boutique : matière, coupe, couleur, taille, édition, origine et disponibilité.</p></div>
            <div className="prism-specimen-object"><div className="prism-specimen-ring" /><div className="prism-specimen-square" /><span>TEXTURE / 026</span></div>
          </section>

          <section className="prism-vault-visit" id="prism-visit">
            <div><span>05 / VISIT</span><h2>FIND<br /><em>THE FORM.</em></h2></div>
            <div className="prism-address"><MapPin size={18} /><div><strong>Maison Naya</strong><span>Haie Vive, Cotonou</span><span>Ouvert aujourd’hui · 08:00 — 20:00</span></div><button aria-label="Voir l’adresse"><ArrowUpRight size={17} /></button></div>
          </section>
        </main>

        <footer className="prism-vault-footer"><span>MN / MAISON NAYA</span><span>Vitrine Loka</span><span>© 2026</span></footer>
      </div>

      <StorefrontProductQuickView product={selected} open={Boolean(selected)} onClose={() => setSelected(null)} theme="prismvault" preview={preview} />
    </div>
  );
}
