import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowUpRight, Heart, Menu, Search, ShoppingBag } from 'lucide-react';
import { publicItems } from '../../data/demo';
import { StorefrontProductQuickView, type StorefrontProduct } from './StorefrontProductQuickView';

export function BoutiqueSpectrumIndexTemplate({ preview = false, accent = '#00E5FF' }: { preview?: boolean; accent?: string }) {
  const item = publicItems.shop;
  const [selected, setSelected] = useState<StorefrontProduct | null>(null);
  const products: StorefrontProduct[] = [
    { id: 'SO-01', name: 'Everyday Form', category: 'ACCESSOIRE', price: '45 000 FCFA', image: item.media[1].src, alt: item.media[1].alt, description: 'Une pièce pensée pour le quotidien : simple à porter, assez expressive pour devenir un repère.', colors: ['#111A3A', '#FF5A36', '#F4EFE4'], sizes: ['S', 'M', 'L', 'XL'], details: [{ label: 'Matière', value: 'Coton & textile mixte' }, { label: 'Disponibilité', value: 'En stock' }, { label: 'Origine', value: 'Sélection locale' }] },
    { id: 'SO-02', name: 'Soft Structure', category: 'COLLECTION', price: '32 000 FCFA', image: item.media[0].src, alt: item.media[0].alt, description: 'Une silhouette plus douce, construite autour de proportions calmes et d’un détail graphique.', colors: ['#00E5FF', '#FFE8A3', '#111A3A'], sizes: ['Unique'], details: [{ label: 'Matière', value: 'Textile souple' }, { label: 'Disponibilité', value: 'En stock' }, { label: 'Édition', value: 'Drop 02' }] },
    { id: 'SO-03', name: 'Signal Piece', category: 'ÉDITION', price: '58 000 FCFA', image: item.media[1].src, alt: item.media[1].alt, description: 'Une pièce signature avec une présence plus forte, destinée à devenir le point focal d’une tenue.', colors: ['#FF5A36', '#FFB6D9', '#111A3A'], sizes: ['M', 'L'], details: [{ label: 'Matière', value: 'Textile premium' }, { label: 'Disponibilité', value: 'Dernières pièces' }, { label: 'Édition', value: 'Limited' }] },
  ];

  return (
    <div className="spectrum-template" style={{ '--spectrum-accent': accent || '#00E5FF' } as CSSProperties}>
      <header className="spectrum-nav">
        <button className="spectrum-menu" aria-label="Menu"><Menu size={19} /></button>
        <a href="#spectrum-top" className="spectrum-logo"><span>MN</span><strong>MAISON NAYA</strong></a>
        <nav><a href="#spectrum-index">INDEX</a><a href="#spectrum-house">HOUSE</a><a href="#spectrum-visit">VISIT</a></nav>
        <div className="spectrum-nav-actions"><button aria-label="Rechercher"><Search size={17} /></button><button aria-label="Panier"><ShoppingBag size={17} /></button>{!preview && <button aria-label="Favoris"><Heart size={17} /></button>}</div>
      </header>

      <main>
        <section className="spectrum-hero" id="spectrum-top">
          <div className="spectrum-hero-top"><span>LOCAL OBJECTS / COTONOU</span><span>09—25 / 2026</span></div>
          <div className="spectrum-hero-title"><span className="spectrum-side-label">A DIFFERENT<br />KIND OF CATALOGUE</span><h1>EVERYDAY<br /><em>OBJECTS.</em></h1></div>
          <div className="spectrum-hero-art">
            <div className="spectrum-cyan-panel" /><div className="spectrum-orange-panel" />
            <img src={item.media[1].src} alt={item.media[1].alt} />
            <div className="spectrum-art-caption"><span>OBJECT 01</span><strong>FORM / USE / ATTITUDE</strong></div>
          </div>
          <p className="spectrum-hero-note">Une vitrine qui fonctionne comme un index visuel : chaque pièce possède une position, un numéro et une histoire.</p>
        </section>

        <section className="spectrum-index" id="spectrum-index">
          <div className="spectrum-index-head"><div><span>01 / CURRENT INDEX</span><h2>Find<br /><em>your signal.</em></h2></div><p>Pas de grille répétitive. Les produits deviennent une série éditoriale que l’on peut ouvrir, inspecter et comparer.</p></div>
          <div className="spectrum-list">
            {products.map((product, index) => (
              <button className={`spectrum-row ${index === 1 ? 'featured' : ''}`} key={product.id} onClick={() => setSelected(product)} aria-label={`Voir ${product.name}`}>
                <span className="spectrum-number">0{index + 1}</span>
                <span className="spectrum-thumb"><img src={product.image} alt={product.alt} /></span>
                <span className="spectrum-row-main"><strong>{product.name}</strong><small>{product.category} · {product.details[0].value}</small></span>
                <span className="spectrum-row-price">{product.price}</span>
                <span className="spectrum-row-arrow"><ArrowUpRight size={19} /></span>
              </button>
            ))}
          </div>
        </section>

        <section className="spectrum-split" id="spectrum-house">
          <div className="spectrum-split-copy"><span>02 / THE HOUSE</span><h2>COLOR IS<br /><em>A SIGNAL.</em></h2><p>{item.description}</p><div className="spectrum-facts"><span><b>4.8</b> NOTE</span><span><b>126</b> AVIS</span><span><b>08—20</b> OUVERT</span></div></div>
          <div className="spectrum-split-visual"><span className="spectrum-vertical-word">MAISON NAYA</span><img src={item.media[0].src} alt="Intérieur de Maison Naya" /><div className="spectrum-corner">COTONOU<br /><strong>HAIE VIVE</strong></div></div>
        </section>

        <section className="spectrum-poster"><div className="spectrum-poster-word">LOCAL /<br /><em>NOT ORDINARY</em></div><div className="spectrum-poster-dot" /><p>Une sélection locale peut avoir une identité globale sans perdre son adresse.</p></section>

        <section className="spectrum-visit" id="spectrum-visit"><div><span>03 / VISIT</span><h2>COME<br /><em>FIND US.</em></h2></div><div className="spectrum-address"><strong>Maison Naya</strong><span>Haie Vive, Cotonou</span><span>Ouvert aujourd’hui · 08:00 — 20:00</span></div></section>
      </main>

      <footer className="spectrum-footer"><span>MN / MAISON NAYA</span><span>Vitrine Loka</span><span>© 2026</span></footer>
      <StorefrontProductQuickView product={selected} open={Boolean(selected)} onClose={() => setSelected(null)} theme="spectrum" preview={preview} />
    </div>
  );
}
