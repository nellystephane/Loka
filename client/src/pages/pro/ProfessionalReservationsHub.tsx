import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Hotel, RefreshCw, Utensils } from 'lucide-react';
import { getSpaces } from '../../services/professional';

const kinds: Record<string, { label: string; description: string; icon: typeof Hotel; href: (id: string) => string }> = {
  restauration: {
    label: 'Restaurant',
    description: 'Consulter les réservations de tables, gérer les arrivées et clôturer les services.',
    icon: Utensils,
    href: (id) => `/pro/reservations?espaceType=restauration&espaceId=${encodeURIComponent(id)}`,
  },
  hotel: {
    label: 'Hôtel',
    description: 'Gérer les réservations de séjour, les arrivées, les départs et les hébergements.',
    icon: Hotel,
    href: (id) => `/pro/reservations?espaceType=hotel&espaceId=${encodeURIComponent(id)}`,
  },
};

export function ProfessionalReservationsHub() {
  const token = localStorage.getItem('token');
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    if (!token) {
      setError('Connectez-vous pour gérer les réservations de votre activité.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const allSpaces = await getSpaces(token);
      setSpaces(allSpaces.filter((space: any) => ['restauration', 'hotel'].includes(space.type) && (space.data?._id || space.id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger vos activités.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  if (loading) return <main className="professional-page"><div className="commerce-empty" role="status"><RefreshCw size={20} /> Chargement des espaces de réservation…</div></main>;

  return <main className="professional-page">
    <header className="professional-page-head">
      <div><span className="section-eyebrow">Espace professionnel</span><h2>Réservations</h2><p>Choisissez le contexte métier à gérer. Les réservations de restaurant et d’hôtel gardent leurs états et leurs actions propres.</p></div>
      <button className="button button-secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={15} /> Actualiser</button>
    </header>
    {error && <div className="commerce-inline-state error" role="alert">{error}<button className="button button-secondary" onClick={() => void load()}>Réessayer</button></div>}
    {!error && spaces.length === 0 && <div className="commerce-empty"><CalendarDays size={24}/><h3>Aucun espace avec réservation</h3><p>Créez un restaurant ou un hôtel pour gérer les réservations depuis cet espace.</p><a className="button button-primary" href="/pro/nouvelle-activite">Créer une activité <ArrowRight size={15}/></a></div>}
    {!error && spaces.length > 0 && <section className="professional-space-grid">
      {spaces.map((space: any) => {
        const config = kinds[space.type];
        const Icon = config.icon;
        const id = String(space.data?._id || space.id);
        const name = space.data?.nom || config.label;
        return <article className="professional-space-card" key={`${space.type}-${id}`}>
          <div className="professional-row-icon"><Icon size={19}/></div>
          <span>{config.label}</span><h3>{name}</h3>
          <p>{config.description}</p>
          <div className="professional-space-actions"><a className="button button-primary" href={config.href(id)}>Gérer les réservations <ArrowRight size={15}/></a></div>
        </article>;
      })}
    </section>}
  </main>;
}
