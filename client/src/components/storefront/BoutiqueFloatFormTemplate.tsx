import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowRight, Heart, MapPin, MessageCircle, Plus, Share2, ShoppingBag, Sparkles } from 'lucide-react';
import { publicItems } from '../../data/demo';
import { buildBoutiqueProducts } from './boutiqueProductData';
import { StorefrontProductQuickView, type StorefrontProduct } from './StorefrontProductQuickView';

export function BoutiqueFloatFormTemplate({ preview = false, accent = '#6D5DF6' }: { preview?: boolean; accent?: string }) {
  const item = publicItems.shop;
  const [selected, setSelected] = useState<StorefrontProduct | null>(null);
  const products = buildBoutiqueProducts(item);
  const signature = accent || '#6D5DF6';

  return (
    <div className="floatform-template" style={{ '--float-accent': signature } as CSSProperties}>
      <header className="floatform-nav">
        <div className="floatform-logo"><span>MN</span><strong>{item.title}</strong></div>
        <nav><a href="#float-products">Collection</a><a href="#float-story">Maison</a><a href="#float-contact">Contact</a></nav>
        <div className="floatform-nav-actions">
          {!preview && <button aria-label="Partager"><Share2 size={16} /></button>}
          <button aria-label="Panier"><ShoppingBag size={17} /></button>
        </div>
      </header>

      <main>
        <section className="floatform-hero">
          <div className="floatform-hero-copy">
            <span className="floatform-kicker">MAISON NAYA · COTONOU</span>
            <h1>Objects<br /><em>with lift.</em></h1>
            <p>{item.description}</p>
            <div className="floatform-actions">
              {!preview && <a className="floatform-primary" href="#float-products">Voir les pièces <ArrowRight size={17} /></a>}
              <span className="floatform-note"><Sparkles size={14} /> Curated locally</span>
            </div>
          </div>

          <div className="floatform-stage">
            <div className="floatform-orb floatform-orb-one" />
            <div className="floatform-orb floatform-orb-two" />
            <div className="floatform-back-card" />
            <div className="floatform-product-card floatform-product-main">
              <div className="floatform-product-top"><span>01 / SIGNATURE</span><button aria-label="Favori"><Heart size={16} /></button></div>
              <div className="floatform-product-image"><img src={item.media[1].src} alt={item.media[1].alt} /></div>
              <div className="floatform-product-caption"><strong>Forme libre</strong><span>Édition Maison Naya</span><b>04</b></div>
            </div>
            <div className="floatform-mini-card">
              <span>NEW</span><strong>02</strong><small>Selected object</small>
            </div>
            <div className="floatform-float-label"><span>01</span><strong>4.8</strong><small>126 avis</small></div>
          </div>
        </section>

        <div className="floatform-ticker"><span>FORM · MATIÈRE · SILHOUETTE</span><span>FORM · MATIÈRE · SILHOUETTE</span><span>FORM · MATIÈRE · SILHOUETTE</span></div>

        <section className="floatform-products" id="float-products">
          <div className="floatform-section-head"><div><span className="floatform-kicker">01 / THE OBJECTS</span><h2>Made to<br /><em>stand out.</em></h2></div><p>Les produits ne sont pas posés dans des cartes identiques. Chaque pièce possède son propre espace, sa profondeur et son rythme.</p></div>
          <div className="floatform-grid">
            <article className="floatform-item floatform-item-a" role="button" tabIndex={0} onClick={() => setSelected(products[0])} onKeyDown={(event) => event.key === 'Enter' && setSelected(products[0])}><div className="floatform-card"><span className="floatform-index">01</span><img src={item.media[0].src} alt={item.media[0].alt} /><button aria-label="Ajouter aux favoris"><Heart size={17} /></button></div><div className="floatform-item-info"><div><strong>La matière</strong><small>Collection signature</small></div><b>Explorer</b></div></article>
            <article className="floatform-item floatform-item-b" role="button" tabIndex={0} onClick={() => setSelected(products[1])} onKeyDown={(event) => event.key === 'Enter' && setSelected(products[1])}><div className="floatform-card"><span className="floatform-index">02</span><img src={item.media[1].src} alt={item.media[1].alt} /><button aria-label="Ajouter aux favoris"><Plus size={17} /></button></div><div className="floatform-item-info"><div><strong>La silhouette</strong><small>Édition 04</small></div><b>Explorer</b></div></article>
            <article className="floatform-item floatform-item-c" role="button" tabIndex={0} onClick={() => setSelected(products[2])} onKeyDown={(event) => event.key === 'Enter' && setSelected(products[2])}><div className="floatform-card floatform-card-color"><span>03</span><div><em>new</em><strong>FORM<br />STUDY</strong></div><button aria-label="Découvrir"><ArrowRight size={18} /></button></div><div className="floatform-item-info"><div><strong>Form Study</strong><small>À découvrir</small></div><b>Explorer</b></div></article>
          </div>
        </section>

        <section className="floatform-story" id="float-story">
          <div className="floatform-story-visual"><div className="floatform-story-ring" /><img src={item.media[0].src} alt="Intérieur de Maison Naya" /><span>02 / HOUSE</span></div>
          <div className="floatform-story-copy"><span className="floatform-kicker">02 / THE HOUSE</span><h2>Give the<br /><em>object room.</em></h2><p>Maison Naya construit ses collections autour d'une idée simple : donner assez d'espace à chaque objet pour qu'il soit remarqué, compris et désiré.</p><div className="floatform-stats"><span><b>4.8</b>NOTE</span><span><b>126</b>AVIS</span><span><b>08—20</b>OUVERT</span></div>{!preview && <a className="floatform-outline" href="#float-contact">Découvrir la maison <ArrowRight size={16} /></a>}</div>
        </section>

        <section className="floatform-contact" id="float-contact"><div><span className="floatform-kicker">03 / VISIT</span><h2>Come<br /><em>closer.</em></h2></div><div className="floatform-contact-card"><MapPin size={19} /><div><strong>Haie Vive, Cotonou</strong><span>Ouvert aujourd'hui · 08:00—20:00</span></div>{!preview && <button>Itinéraire <ArrowRight size={16} /></button>}</div></section>
      </main>

      <StorefrontProductQuickView product={selected} open={Boolean(selected)} onClose={() => setSelected(null)} theme="floatform" preview={preview} />
      <footer className="floatform-footer"><div><span>MN</span><strong>{item.title}</strong></div><span>Une vitrine Loka</span><span>© 2026</span></footer>
      <div className="floatform-mobile-dock"><button className="active"><ShoppingBag size={17} /><span>Collection</span></button><button><Heart size={17} /><span>Favoris</span></button>{!preview && <button><MessageCircle size={17} /><span>Contacter</span></button>}</div>
    </div>
  );
}
