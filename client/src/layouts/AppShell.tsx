import { useEffect, useState, type ReactNode } from 'react';
import { appPath } from '../utils/navigation';
import { Bell, CalendarDays, ChevronLeft, ClipboardList, CreditCard, Home, MessageCircle, Moon, MoreHorizontal, Package, Search, Settings, Sun, Truck, UserRound, Store, UserPlus } from 'lucide-react';
import { getSpaces } from '../services/professional';

const clientNav = [
  ['/','Accueil',Home], ['/recherche','Explorer',Search], ['/messages','Messages',MessageCircle], ['/notifications','Notifications',Bell], ['/profil','Profil',UserRound], ['/mon-espace','Mon espace',Store], ['/mes-annonces','Mes annonces',ClipboardList]
] as const;
const professionalNav = [
  ['/pro','Vue d’ensemble',Home], ['/pro/catalogue','Catalogue / menu / chambres',Package], ['/pro/commandes','Commandes',ClipboardList], ['/pro/livraisons','Livraisons',Truck], ['/pro/messages','Messages',MessageCircle], ['/pro/finances','Finances',CreditCard], ['/pro/abonnement','Abonnement',CalendarDays], ['/pro/vitrine','Vitrine',Store], ['/pro/parametres','Paramètres',Settings]
] as const;
const authPaths = ['/connexion','/inscription','/mot-de-passe-oublie','/reset-password','/verification-email','/renvoyer-confirmation'];
function isPublicPath(path: string) {
  if (authPaths.some(p => path === p || path.startsWith(`${p}/`))) return true;
  // Seuls les espaces explicitement privés utilisent le shell connecté.
  // Une nouvelle route publique/catégorie ne doit jamais hériter par défaut
  // du menu client/professionnel simplement parce qu'elle n'est pas listée.
  const privatePrefixes = ['/pro', '/profil', '/panier', '/checkout', '/commande', '/messages', '/notifications', '/favoris', '/client', '/reservations', '/mon-espace', '/mes-annonces'];
  if (privatePrefixes.some(p => path === p || path.startsWith(`${p}/`))) return false;
  if (path.startsWith('/livraison/') && !path.startsWith('/livraison/options')) return false;
  return true;
}
function PublicHeader({theme,onToggleTheme}:{theme:'light'|'dark';onToggleTheme:()=>void}) {
  return <header className="public-header"><a className="public-brand" href={appPath("/")}><span className="brand-mark">L</span><strong>Loka</strong></a><nav aria-label="Navigation publique"><a href={appPath("/recherche")}>Explorer</a><a href={appPath(localStorage.getItem('token') ? '/profil' : '/connexion')}>{localStorage.getItem('token') ? 'Mon compte' : 'Connexion'}</a><button type="button" className="public-theme-toggle" onClick={onToggleTheme} aria-label={theme==='dark'?'Activer le thème clair':'Activer le thème sombre'} title={theme==='dark'?'Mode clair':'Mode sombre'}>{theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}</button><a className="public-header-cta" href={appPath(localStorage.getItem('token') ? '/mon-espace' : '/inscription')}><UserPlus size={15}/> {localStorage.getItem('token') ? 'Mon espace' : 'Commencer avec Loka'}</a></nav></header>;
}
export function AppShell({ children }: { children?: ReactNode }) {
  const path = window.location.pathname.replace(/^\/Loka(?=\/|$)/, '') || '/';
  const isPro = path.startsWith('/pro');
  const [theme, setTheme] = useState<'light'|'dark'>(() => (localStorage.getItem('loka-theme') === 'dark' ? 'dark' : 'light'));
  const [moreOpen, setMoreOpen] = useState(false);
  const [professionalSpaces,setProfessionalSpaces]=useState<any[]>([]);
  useEffect(()=>{if(!isPro)return;const token=localStorage.getItem('token');if(!token)return;getSpaces(token).then(setProfessionalSpaces).catch(()=>setProfessionalSpaces([]));},[isPro,path]);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('loka-theme', theme); }, [theme]);
  useEffect(() => {
    if (!isPro || localStorage.getItem('token')) return;
    const requested = path + window.location.search;
    window.location.replace(appPath('/connexion') + '?returnTo=' + encodeURIComponent(requested));
  }, [isPro, path]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  if (authPaths.some(p => path === p || path.startsWith(`${p}/`))) return <>{children}</>;
  if (isPublicPath(path)) return <div className="public-layout"><PublicHeader theme={theme} onToggleTheme={toggleTheme}/>{children}<a className="publish-floating-cta" href={appPath('/publier-annonce')} aria-label="Publier une annonce"><span>+</span><strong>Déposer une annonce</strong></a><footer className="public-footer"><span>© Loka</span><a href={appPath("/inscription")}>Vous êtes professionnel ? Commencez avec Loka <UserPlus size={14}/></a></footer></div>;
  const nav = isPro ? professionalNav.filter(([href])=>{const types=professionalSpaces.map((s:any)=>s.type);if(href==='/pro/catalogue')return types.some((t:string)=>['vente','restauration','hotel'].includes(t));if(href==='/pro/commandes')return types.some((t:string)=>['vente','restauration'].includes(t));if(href==='/pro/livraisons')return types.some((t:string)=>['livraison','agence_livraison','vente','restauration'].includes(t));if(href==='/pro/reservations')return types.includes('restauration');if(href==='/pro/hotel')return types.includes('hotel');if(href==='/pro/vitrine')return types.some((t:string)=>['vente','restauration','hotel'].includes(t));return true;}) : clientNav;
  const active = (href: string) => href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);
  const title = isPro ? (nav.find(([href]) => active(href))?.[1] || 'Espace professionnel') : (nav.find(([href]) => active(href))?.[1] || 'Mon espace');
  return <div className={`app-shell ${isPro ? 'app-shell-pro' : 'app-shell-client'}`}>
    <aside className="sidebar" aria-label={isPro ? 'Navigation professionnelle' : 'Navigation de votre espace'}>
      <a className="brand" href={appPath("/")} aria-label="Retour à l’accueil Loka"><span className="brand-mark">L</span><span>Loka</span></a>
      <nav className="side-nav">{nav.map(([href,label,Icon]) => <a key={href} className={`nav-item ${active(href) ? 'active' : ''}`} href={appPath(href)} aria-current={active(href) ? 'page' : undefined} title={label}><Icon size={18}/><span>{label}</span></a>)}</nav>
      {isPro && <><a className="side-back-link" href={appPath('/mon-espace')}><Store size={15}/> Mes espaces</a><a className="side-back-link" href={appPath("/")}><ChevronLeft size={15}/> Accueil public</a></>}
      <button className="theme-toggle sidebar-theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}>{theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}<span>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span></button>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><p className="eyebrow">Loka{isPro ? ' · Espace professionnel' : ' · Mon espace'}</p><h1>{title}</h1></div><div className="top-actions"><button className="theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}>{theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}<span>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span></button><a className="topbar-home-link" href={appPath("/")} aria-label="Retour à l’accueil Loka"><Home size={17}/><span>Accueil</span></a></div></header>
      {children}
    </main>
    <nav className="mobile-nav" aria-label={isPro ? 'Navigation professionnelle mobile' : 'Navigation mobile'}>
      {(isPro ? professionalNav.slice(0,4) : clientNav.slice(0,4)).map(([href,label,Icon]) => <a key={href} className={`mobile-nav-item ${active(href) ? 'active' : ''}`} href={appPath(href)} aria-current={active(href) ? 'page' : undefined}><Icon size={20}/><span>{label.length > 13 ? label.split(' / ')[0] : label}</span></a>)}
      {isPro ? <button className={`mobile-nav-item ${moreOpen ? 'active' : ''}`} onClick={() => setMoreOpen(v => !v)} aria-expanded={moreOpen}><MoreHorizontal size={20}/><span>Plus</span></button> : <a className={`mobile-nav-item ${active('/profil') ? 'active' : ''}`} href={appPath("/profil")}><UserRound size={20}/><span>Profil</span></a>}
    </nav>
    {isPro && moreOpen && <div className="mobile-more-menu" role="menu">{nav.slice(4).map(([href,label,Icon]) => <a key={href} href={appPath(href)} role="menuitem"><Icon size={17}/>{label}</a>)}<button onClick={toggleTheme}><Moon size={17}/>Changer de thème</button><a href={appPath("/")}><Home size={17}/>Retour à l’accueil</a></div>}
  </div>;
}
