import { useEffect, useMemo, useRef, useState } from 'react';
import { trackEvent } from '../services/analytics';
import { ArrowRight, Layers3, RefreshCw, Search, ShoppingBag, UtensilsCrossed, Wrench } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';
type CategoryItem = { name: string; count: number; kind: 'annonce' | 'produit' | 'plat' };
const groups = [
  { key: 'annonce', title: 'Services et annonces', description: 'Prestations locales, annonces et services proposés par la communauté.', Icon: Wrench },
  { key: 'produit', title: 'Produits et boutiques', description: 'Produits réellement disponibles dans les boutiques publiées.', Icon: ShoppingBag },
  { key: 'plat', title: 'Plats et restauration', description: 'Plats disponibles dans les restaurants publiés.', Icon: UtensilsCrossed },
] as const;

export function CategoriesPage() {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/recherche/categories`);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || 'Impossible de charger les catégories.');
      setItems(Array.isArray(body.categories) ? body.categories : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les catégories.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => { if (!loading && !error) trackEvent('view', 'category_directory', undefined, { count: items.length }); }, [loading, error, items.length]);
  const query = filter.trim().toLocaleLowerCase('fr');
  const visibleGroups = useMemo(() => groups.map((group) => ({
    ...group,
    items: items.filter((item) => item.kind === group.key && (!query || item.name.toLocaleLowerCase('fr').includes(query))),
  })).filter((group) => group.items.length > 0), [items, query]);

  return <main className="categories-page">
    <header className="categories-hero">
      <span className="section-eyebrow"><Layers3 size={14} /> Explorer Loka</span>
      <h2>Que souhaitez-vous découvrir ?</h2>
      <p>Explorez les catégories qui contiennent actuellement des contenus publics. Les résultats proviennent des annonces, produits et plats disponibles.</p>
      <label className="categories-filter"><Search size={18} /><input value={filter} onChange={(event) => setFilter(event.target.value)} onBlur={() => { if (filter.trim()) trackEvent('filter', 'category_directory', undefined, { query: filter.trim() }); }} placeholder="Filtrer les catégories…" aria-label="Filtrer les catégories" /></label>
    </header>
    {error && <div className="commerce-inline-state error" role="alert"><span>{error}</span><button className="button button-secondary" onClick={() => void load()}>Réessayer</button></div>}
    {loading ? <div className="commerce-empty" role="status"><RefreshCw size={22} /><h3>Chargement des catégories…</h3></div> : !visibleGroups.length ? <div className="commerce-empty"><Layers3 size={24} /><h3>{query ? 'Aucune catégorie correspondante' : 'Aucune catégorie publique pour le moment'}</h3><p>{query ? 'Essayez un autre terme ou consultez les annuaires.' : 'Les catégories apparaîtront dès que des annonces, produits ou plats seront publiés.'}</p><a className="button button-secondary" href="/recherche">Ouvrir la recherche</a></div> : <div className="categories-groups">{visibleGroups.map(({ key, title, description, Icon, items: categoryItems }) => <section className="categories-group" key={key}>
      <header className="categories-group-header"><span className="categories-group-icon"><Icon size={20} /></span><div><h3>{title}</h3><p>{description}</p></div></header>
      <div className="categories-grid">{categoryItems.map((item) => <CategoryTile key={`${item.kind}:${item.name}`} item={item} />)}</div>
    </section>)}</div>}
  </main>;
}


function CategoryTile({ item }: { item: CategoryItem }) {
  const element = useRef<HTMLAnchorElement | null>(null);
  const seen = useRef(false);
  const clicked = useRef(false);
  const ignored = useRef(false);
  const timer = useRef<number | null>(null);
  const href = `/recherche?q=${encodeURIComponent(item.name)}`;
  useEffect(() => {
    const node = element.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !seen.current && timer.current === null) {
          timer.current = window.setTimeout(() => {
            seen.current = true;
            trackEvent('category_impression', item.kind, undefined, { category: item.name, count: item.count, exposureMs: 1800 });
            timer.current = null;
          }, 1800);
        } else if (!entry.isIntersecting) {
          if (timer.current !== null) { window.clearTimeout(timer.current); timer.current = null; }
          if (seen.current && !clicked.current && !ignored.current) {
            ignored.current = true;
            trackEvent('category_ignored', item.kind, undefined, { category: item.name, count: item.count, exposureMs: 1800 });
          }
        }
      }
    }, { threshold: 0.6 });
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (timer.current !== null) window.clearTimeout(timer.current);
      if (seen.current && !clicked.current && !ignored.current) trackEvent('category_ignored', item.kind, undefined, { category: item.name, count: item.count, exposureMs: 1800 });
    };
  }, [item.kind, item.name, item.count]);
  return <a ref={element} className="category-tile" href={href} onClick={() => { clicked.current = true; trackEvent('category_click', item.kind, undefined, { category: item.name, count: item.count }); trackEvent('search', 'category', undefined, { query: item.name, source: 'category_directory' }); }}><span><strong>{item.name}</strong><small>{item.count} {item.count === 1 ? 'contenu public' : 'contenus publics'}</small></span><ArrowRight size={17} /></a>;
}
