import { useEffect, useState } from 'react';
import { ArrowRight, Bookmark, LogOut, MapPin, MessageCircle, Package, ShieldCheck, Store, UserRound } from 'lucide-react';
import { API_BASE } from '../services/apiConfig';
import { appPath } from '../utils/navigation';

type Profile = { prenom?: string; nom?: string; email?: string; telephone?: string; photo?: string; localisation?: { ville?: string }; role?: string };

export function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.replace(appPath('/connexion') + '?returnTo=' + encodeURIComponent('/profil'));
      return;
    }
    fetch(`${API_BASE}/api/users/profil`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Impossible de charger votre compte.');
        setProfile(data);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Une erreur est survenue.'))
      .finally(() => setLoading(false));
  }, []);
  function logout() {
    localStorage.removeItem('token'); localStorage.removeItem('loka_user');
    window.location.assign(appPath('/'));
  }
  return <main className="profile-page">
    <header className="profile-welcome"><span className="profile-eyebrow"><UserRound size={14}/> MON ESPACE LOKA</span><h1>{profile?.prenom ? `Bonjour ${profile.prenom}` : 'Votre espace personnel'}</h1><p>Retrouvez vos activités et reprenez votre parcours là où vous l'avez laissé.</p></header>
    {loading ? <div className="profile-state" role="status">Chargement de votre espace…</div> : error ? <div className="profile-state profile-state-error" role="alert"><strong>Votre espace n'est pas accessible pour le moment.</strong><p>{error}</p><a className="profile-primary" href={appPath('/connexion')}>Se reconnecter <ArrowRight size={16}/></a></div> : <>
      <section className="profile-identity"><div className="profile-avatar">{profile?.photo ? <img src={profile.photo} alt=""/> : <UserRound size={24}/>}</div><div className="profile-identity-copy"><strong>{[profile?.prenom, profile?.nom].filter(Boolean).join(' ') || 'Utilisateur Loka'}</strong><span>{profile?.email || 'Adresse e-mail non renseignée'}</span>{profile?.localisation?.ville && <span className="profile-location"><MapPin size={13}/>{profile.localisation.ville}</span>}</div><span className="profile-verified"><ShieldCheck size={15}/> Compte</span></section>
      <section className="profile-shortcuts" aria-label="Mes activités">
        <a href={appPath('/recherche')}><span className="profile-shortcut-icon"><MapPin size={19}/></span><strong>Continuer à explorer</strong><p>Découvrez les commerces et services autour de vous.</p><span className="profile-shortcut-link">Explorer <ArrowRight size={15}/></span></a>
        <a href={appPath('/messages')}><span className="profile-shortcut-icon"><MessageCircle size={19}/></span><strong>Mes messages</strong><p>Reprenez vos échanges avec les professionnels.</p><span className="profile-shortcut-link">Ouvrir les messages <ArrowRight size={15}/></span></a>
        <a href={appPath('/panier')}><span className="profile-shortcut-icon"><Package size={19}/></span><strong>Mon panier</strong><p>Retrouvez les articles que vous souhaitez commander.</p><span className="profile-shortcut-link">Voir le panier <ArrowRight size={15}/></span></a>
        <a href={appPath('/pro')}><span className="profile-shortcut-icon"><Store size={19}/></span><strong>Espace professionnel</strong><p>Accédez aux outils de gestion de votre activité sur Loka.</p><span className="profile-shortcut-link">Ouvrir mon espace pro <ArrowRight size={15}/></span></a>
      </section>
      <div className="profile-bottom-actions"><a href={appPath('/')} className="profile-secondary">Retour à l'accueil public</a><button type="button" className="profile-logout" onClick={logout}><LogOut size={16}/> Se déconnecter</button></div>
    </>}
  </main>;
}
