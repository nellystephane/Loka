import { ArrowDown, ArrowUpRight, Heart, MapPin, Menu, Share2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { publicItems } from '../../data/demo';
import { buildBoutiqueProducts } from './boutiqueProductData';
import { StorefrontProductQuickView, type StorefrontProduct } from './StorefrontProductQuickView';

export function BoutiqueEditorialTemplate({ preview = false, accent = '#7C6A55' }: { preview?: boolean; accent?: string }) {
  const item = publicItems.shop;
  const [selected, setSelected] = useState<StorefrontProduct | null>(null);
  const products = buildBoutiqueProducts(item);
  const [hero, secondary] = item.media;

  return (
    <article className="be-template" style={{ '--be-accent': accent } as React.CSSProperties}>
      <header className="be-nav">
        <div className="be-brand"><span className="be-brand-mark">MN</span><span>{item.title}</span></div>
        <nav><a href="#collection">Collection</a><a href="#story">Maison</a><a href="#journal">Journal</a></nav>
        <div className="be-nav-actions"><button aria-label="Partager"><Share2 size={17} /></button><button aria-label="Menu"><Menu size={19} /></button></div>
      </header>

      <section className="be-hero">
        <div className="be-hero-copy">
          <span className="be-kicker">Cotonou · Haie Vive · {item.rating} ★</span>
          <h1>Objets choisis.<br /><em>Présence locale.</em></h1>
          <p>{item.description}</p>
          <div className="be-hero-actions">
            <a href="#collection" className="be-primary">Découvrir la collection <ArrowDown size={16} /></a>
            {!preview && <button className="be-text-button"><Heart size={16} /> Enregistrer</button>}
          </div>
        </div>
        <div className="be-hero-media">
          <img src={hero.src} alt={hero.alt} />
          <div className="be-media-note"><span>01 / 02</span><span>Maison Naya</span></div>
        </div>
      </section>

      <div className="be-marquee" aria-hidden="true"><span>LOCAL OBJECTS</span><i>✦</i><span>CURATED DAILY</span><i>✦</i><span>MADE TO BE LIVED</span><i>✦</i><span>COTONOU</span></div>

      <section className="be-intro" id="story">
        <div className="be-section-index">01</div>
        <div><span className="be-kicker">L'intention</span><h2>Une boutique qui se lit comme une <em>maison.</em></h2></div>
        <p>Une sélection pensée pour le quotidien, présentée avec assez d'espace pour laisser chaque pièce respirer. Ici, la vitrine devient une extension de l'identité de la boutique.</p>
      </section>

      <section className="be-collection" id="collection">
        <div className="be-section-head"><div><span className="be-kicker">02 · Sélection</span><h2>La collection actuelle</h2></div><a href="#collection">Voir tout <ArrowUpRight size={16} /></a></div>
        <div className="be-products">
          <article className="be-product be-product-featured" role="button" tabIndex={0} onClick={() => setSelected(products[0])} onKeyDown={(event) => event.key === 'Enter' && setSelected(products[0])}><div className="be-product-image"><img src={hero.src} alt={hero.alt} /><span>Édition 01</span></div><div className="be-product-meta"><div><strong>La sélection signature</strong><small>Pièces choisies · Cotonou</small></div><ArrowUpRight size={18} /></div></article>
          <article className="be-product be-product-offset" role="button" tabIndex={0} onClick={() => setSelected(products[1])} onKeyDown={(event) => event.key === 'Enter' && setSelected(products[1])}><div className="be-product-image"><img src={secondary.src} alt={secondary.alt} /><span>Édition 02</span></div><div className="be-product-meta"><div><strong>Le quotidien, autrement</strong><small>Mode & accessoires</small></div><ArrowUpRight size={18} /></div></article>
        </div>
      </section>

      <section className="be-story" id="journal">
        <div className="be-story-image"><img src={secondary.src} alt={secondary.alt} /><span>03</span></div>
        <div className="be-story-copy"><span className="be-kicker">03 · Le journal</span><h2>Le beau n'a pas besoin de faire du bruit.</h2><p>Nous croyons aux matières, aux détails et aux objets qui trouvent naturellement leur place. Notre sélection évolue au fil des saisons, des rencontres et des envies.</p><a href="#contact">Découvrir la maison <ArrowUpRight size={16} /></a></div>
      </section>

      <section className="be-contact" id="contact">
        <div><span className="be-kicker">04 · Venez nous voir</span><h2>Haie Vive,<br /><em>Cotonou.</em></h2></div>
        <div className="be-contact-info"><div><MapPin size={18} /><span>{item.location}</span></div><p>Ouvert aujourd'hui · 08:00 — 20:00</p><a href="#contact" className="be-primary">Voir l'itinéraire <ArrowUpRight size={16} /></a></div>
      </section>

      <StorefrontProductQuickView product={selected} open={Boolean(selected)} onClose={() => setSelected(null)} theme="editorial" preview={preview} />
      <footer className="be-footer"><div className="be-footer-brand"><Sparkles size={16} /><strong>Maison Naya</strong></div><span>Une vitrine Loka</span><span>© 2026</span></footer>
    </article>
  );
}
