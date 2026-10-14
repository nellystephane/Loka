import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { Bell, CalendarDays, ChevronLeft, ClipboardList, CreditCard, Home, MessageCircle, Moon, Package, Search, Settings, Sun, Truck, UserRound, Store, Compass, Heart, ShoppingBag, ShieldCheck, Users, AlertTriangle } from 'lucide-react';
import { Button } from '../components/primitives/Button';
import { trackEvent } from '../services/analytics';
import { appBasePath, getAppPath, withAppBasePath } from '../utils/appBasePath';

const clientNav = [
  ['/','Accueil',Home], ['/recherche','Recherche',Search], ['/messages','Messages',MessageCircle], ['/activites','Activités',CalendarDays], ['/favoris','Favoris',Heart], ['/notifications','Notifications',Bell], ['/litiges','Support & litiges',AlertTriangle], ['/remboursements','Remboursements',CreditCard], ['/mes-annonces','Mes annonces',Package], ['/profil','Profil',UserRound]
] as const;
const professionalNav = [
  ['/pro','Vue d’ensemble',Home], ['/pro/catalogue','Catalogue / menu / chambres',Package], ['/pro/commandes','Commandes',ClipboardList], ['/pro/reservations','Réservations',CalendarDays], ['/pro/clients','Clients / contacts',UserRound], ['/pro/livraisons','Livraisons',Truck], ['/pro/livraisons/groupees','Livraison groupée',Truck], ['/pro/messages','Messages',MessageCircle], ['/pro/finances','Finances',CreditCard], ['/pro/abonnement','Abonnement',CalendarDays], ['/pro/vitrine','Vitrine',Store], ['/pro/parametres','Paramètres',Settings]
] as const;
const adminNav = [['/admin','Supervision',ShieldCheck], ['/admin/utilisateurs','Utilisateurs',Users], ['/admin/litiges','Litiges',AlertTriangle], ['/admin/payouts','Versements',CreditCard]] as const;
const discoveryNav = [ ['/categories','Catégories',Compass], ['/boutiques','Boutiques',Store], ['/restaurants','Restaurants',Compass], ['/hotels','Hôtels',CalendarDays], ['/livreurs','Livreurs & agences',Truck], ['/annonces/nouvelle','Publier une annonce',ShoppingBag] ] as const;
const publicTitles: Record<string,string> = {
  '/':'Découvrir', '/categories':'Catégories', '/mes-annonces':'Mes annonces', '/recherche':'Recherche', '/boutiques':'Boutiques', '/restaurants':'Restaurants', '/hotels':'Hôtels', '/livreurs':'Livraison', '/messages':'Messages', '/panier':'Panier', '/checkout':'Paiement', '/livraison':'Livraison', '/pro':'Espace professionnel', '/profil':'Mon profil', '/activites':'Mes activités', '/favoris':'Mes favoris', '/notifications':'Notifications', '/litiges':'Support & litiges', '/remboursements':'Remboursements'
};

function prefixInternalLinks(event: MouseEvent<HTMLDivElement>) {
  if (!appBasePath || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  const link = target.closest<HTMLAnchorElement>('a[href]');
  if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
  const href = link.getAttribute('href');
  if (!href || !href.startsWith('/') || href.startsWith('//')) return;
  link.setAttribute('href', withAppBasePath(href));
}

export function AppShell({ children }: { children?: ReactNode }) {
  const path = getAppPath(window.location.pathname);
  const isPro = path.startsWith('/pro');
  const isAdmin = path.startsWith('/admin');
  const isAuthPage = ['/connexion','/inscription','/mot-de-passe-oublie','/reset-password','/verification-email','/verification-email/renvoyer'].includes(path);
  const signedIn = Boolean(localStorage.getItem('token'));
  const nav = isAdmin ? adminNav : isPro ? professionalNav : clientNav;
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark');
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const query = new URLSearchParams(window.location.search);
  const catalogueContext = query.get('espaceType');
  const active = (href: string) => href === '/' ? path === '/' || path === '/app' : (href === '/pro' || href === '/admin') ? path === href : href === '/pro/livraisons' && path === '/pro/livraisons/groupees' ? false : path === href || path.startsWith(`${href}/`);
  const professionalTitle = path === '/pro/catalogue' && catalogueContext === 'restauration'
    ? 'Menu du restaurant'
    : path === '/pro/catalogue' && catalogueContext === 'hotel'
      ? 'Chambres et hébergements'
      : path === '/pro/livraisons/groupees' ? 'Livraison groupée' : professionalNav.find(([href]) => path === href)?.[1] || 'Espace professionnel';
  const title = isAdmin ? (adminNav.find(([href])=>path===href)?.[1]||'Administration') : isPro
    ? professionalTitle
    : (publicTitles[path] || (path === '/app' ? 'Découvrir' : path.startsWith('/restaurant/') && path.endsWith('/reserver') ? 'Réserver une table' : path.startsWith('/hotel/') && path.endsWith('/reserver') ? 'Réserver un hébergement' : path.startsWith('/produit/') ? 'Produit' : path.startsWith('/plat/') ? 'Plat du restaurant' : path.startsWith('/annonce/') ? 'Annonce' : path.startsWith('/boutique/') ? 'Boutique' : path.startsWith('/restaurant/') ? 'Restaurant' : path.startsWith('/hotel/') ? 'Hôtel' : path.startsWith('/vitrine/') ? 'Vitrine' : path.startsWith('/livreur/') ? 'Profil livreur' : path.startsWith('/commande/') ? 'Commande' : path.startsWith('/reservation/') ? 'Détail de réservation' : path.startsWith('/livraison/') ? 'Suivi de livraison' : path === '/annonces/nouvelle' ? 'Publier une annonce' : 'Découvrir'));
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);
  useEffect(() => {
    const key = `loka_view:${path}`;
    let repeated = false;
    try { repeated = Boolean(window.sessionStorage.getItem(key)); window.sessionStorage.setItem(key, '1'); } catch { /* storage can be disabled */ }
    trackEvent('view', 'page', undefined, { path, title, repeated });
  }, [path, title]);
  const toggleTheme = () => setDark(value => !value);
  const share = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: 'Loka', url: location.href }); trackEvent('share', 'page', undefined, { channel: 'native', path }); }
      else if (navigator.clipboard) { await navigator.clipboard.writeText(location.href); trackEvent('share', 'page', undefined, { channel: 'copy', path }); }
    } catch { /* Cancellation is not an error state. */ }
  };
  return <div className={`app-shell ${isPro ? 'app-shell-pro' : ''} ${isAdmin ? 'app-shell-admin' : ''}`} onClickCapture={prefixInternalLinks}>
    <aside className="sidebar" aria-label={isAdmin ? 'Navigation administration' : isPro ? 'Navigation professionnelle' : 'Navigation principale'}>
      <a className="brand" href={isAdmin ? '/admin' : isPro ? '/pro' : '/'} aria-label="Loka"><span className="brand-mark">L</span><span>Loka</span></a>
      <nav className="side-nav">
        <p className="sidebar-section-label">{isAdmin ? 'Pilotage' : isPro ? 'Mon activité' : 'Mon espace'}</p>
        {nav.map(([href,label,Icon]) => <a key={href} className={`nav-item ${active(href) ? 'active' : ''}`} href={href} aria-current={active(href) ? 'page' : undefined} title={label}><Icon size={18}/><span>{label}</span></a>)}
      </nav>
      {!isPro && !isAdmin && <nav className="side-nav sidebar-discovery" aria-label="Explorer les activités"><p className="sidebar-section-label">Explorer</p>{discoveryNav.map(([href,label,Icon]) => <a key={href} className={`nav-item ${active(href) ? 'active' : ''}`} href={href} aria-current={active(href) ? 'page' : undefined}><Icon size={18}/><span>{label}</span></a>)}</nav>}
      {(isPro||isAdmin) && <a className="side-back-link" href="/" title="Retour à Loka"><ChevronLeft size={15}/> Espace client</a>}
    </aside>
    <main className="main-content" onClick={(event) => { const target = event.target; if (!(target instanceof Element)) return; const link = target.closest('a'); if (!link) return; const href = link.getAttribute('href') || ''; if (href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('/messages')) trackEvent('contact', 'navigation', undefined, { href, path }); }}>
      <header className="topbar">
        <div><p className="eyebrow">Loka{isAdmin ? ' · Administration' : isPro ? ' · Espace professionnel' : ''}</p><h1>{title}</h1></div>
        <div className="top-actions">
          <button className="icon-button theme-toggle" onClick={toggleTheme} aria-label={dark ? 'Passer au thème clair' : 'Passer au thème sombre'} title={dark ? 'Thème clair' : 'Thème sombre'}>{dark ? <Sun size={17}/> : <Moon size={17}/>}</button>
          {!isPro && !isAdmin && !isAuthPage && <Button variant="secondary" onClick={share}><Compass size={15}/> Partager</Button>}
          {!isPro && !isAdmin && !isAuthPage && !signedIn && <Button variant="secondary" onClick={() => location.href=withAppBasePath('/connexion')}>Connexion</Button>}
          {!isPro && !isAdmin && !isAuthPage && !signedIn && <Button onClick={() => location.href=withAppBasePath('/inscription')}>Créer un compte</Button>}
          {!isPro && !isAdmin && !isAuthPage && signedIn && <Button onClick={() => location.href=withAppBasePath('/annonces/nouvelle')}><ShoppingBag size={15}/> Publier</Button>}
        </div>
      </header>
      {children}
    </main>
    {!isAuthPage && <>
      {mobileMoreOpen && <>
        <button type="button" className="mobile-more-backdrop" aria-label="Fermer le menu" onClick={() => setMobileMoreOpen(false)} />
        <section id="mobile-more-panel" className="mobile-more-panel" aria-label="Toutes les destinations">
          <div className="mobile-more-heading"><strong>{isAdmin ? 'Administration' : isPro ? 'Mon activité' : 'Explorer Loka'}</strong><button type="button" onClick={() => setMobileMoreOpen(false)}>Fermer</button></div>
          {[...(isAdmin ? adminNav : isPro ? professionalNav : clientNav), ...(!isPro && !isAdmin ? discoveryNav : [])]
            .filter((entry, index, all) => all.findIndex((other) => other[0] === entry[0]) === index)
            .map(([href,label,Icon]) => <a key={href} href={href} className={`mobile-more-link ${active(href) ? 'active' : ''}`} onClick={() => setMobileMoreOpen(false)}><Icon size={18}/><span>{label}</span>{active(href) && <span className="mobile-more-current">Actuel</span>}</a>)}
        </section>
      </>}
      <nav className="mobile-nav" aria-label={isAdmin ? 'Navigation administration mobile' : isPro ? 'Navigation professionnelle mobile' : 'Navigation mobile'}>
        {(isAdmin ? adminNav.slice(0,4) : isPro ? professionalNav.filter(([href]) => ['/pro','/pro/catalogue','/pro/commandes','/pro/reservations'].includes(href)) : clientNav.filter(([href]) => ['/','/recherche','/messages','/activites'].includes(href))).slice(0,4).map(([href,label,Icon]) => <a key={href} className={`mobile-nav-item ${active(href) ? 'active' : ''}`} href={href} aria-current={active(href) ? 'page' : undefined}><Icon size={20}/><span>{label.split(' / ')[0]}</span></a>)}
        <button type="button" className={`mobile-nav-item mobile-nav-more ${mobileMoreOpen ? 'active' : ''}`} onClick={() => setMobileMoreOpen((value) => !value)} aria-expanded={mobileMoreOpen} aria-controls="mobile-more-panel"><Compass size={20}/><span>Plus</span></button>
      </nav>
    </>}
  </div>;
}
