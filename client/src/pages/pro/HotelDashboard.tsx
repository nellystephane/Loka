import { useEffect, useMemo, useState } from 'react';
import { BedDouble, CalendarDays, ChevronLeft, ChevronRight, Clock3, Hotel, MapPin, Plus, RefreshCw, Users, X } from 'lucide-react';
import { Badge } from '../../components/primitives/Feedback';
import { Button } from '../../components/primitives/Button';
import { createHotelCategory, createHotelUnit, getHotelDashboard, updateHotelReservationStatus, updateHotelUnit } from '../../services/hotel';

type DashboardData = any;
type Tab = 'overview' | 'reservations' | 'hebergements' | 'calendrier';

const statusLabel: Record<string, string> = {
  en_attente_paiement: 'Paiement en attente', confirmee: 'Confirmée', arrivee: 'Arrivée', en_sejour: 'En séjour', terminee: 'Terminée', annulee: 'Annulée', expiree: 'Expirée'
};
const statusTone: Record<string, 'success' | 'warning' | 'neutral' | 'error'> = {
  en_attente_paiement: 'warning', confirmee: 'success', arrivee: 'success', en_sejour: 'success', terminee: 'neutral', annulee: 'error', expiree: 'neutral'
};

function localDateInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`));
}
function money(value: number) { return `${Number(value || 0).toLocaleString('fr-FR')} FCFA`; }

export function HotelDashboard({ initialTab = 'overview' }: { initialTab?: Tab } = {}) {
  const token = window.localStorage.getItem('token') || '';
  const [data, setData] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [date, setDate] = useState(() => localDateInputValue());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [unitModal, setUnitModal] = useState<any | null>(null);
  const [categoryModal, setCategoryModal] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load(nextDate = date) {
    if (!token) { setError('Connectez-vous pour accéder à votre espace hôtelier.'); setLoading(false); return; }
    setLoading(true); setError('');
    try { setData(await getHotelDashboard(token, nextDate)); } catch (e) { setError(e instanceof Error ? e.message : 'Impossible de charger le tableau de bord.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const reservations = data?.reservations || [];
  const todayReservations = useMemo(() => reservations.filter((r: any) => String(r.dateArrivee).slice(0, 10) === date || String(r.dateDepart).slice(0, 10) === date), [reservations, date]);

  async function changeStatus(id: string, statut: string) {
    setActionError('');
    try { await updateHotelReservationStatus(id, statut, token); await load(); }
    catch (e) { setActionError(e instanceof Error ? e.message : 'Impossible de mettre à jour la réservation.'); }
  }

  async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setActionError('');
    const form = new FormData(event.currentTarget);
    try {
      await createHotelCategory({ type: form.get('type'), nom: form.get('nom'), description: form.get('description'), prixParNuit: Number(form.get('prixParNuit')), capacite: Number(form.get('capacite') || 2), capaciteAdultes: Number(form.get('capaciteAdultes') || 2), capaciteEnfants: Number(form.get('capaciteEnfants') || 0), nombreUnites: Number(form.get('nombreUnites') || 1) }, token);
      setCategoryModal(false); await load();
    } catch (e) { setActionError(e instanceof Error ? e.message : 'Impossible de créer l’offre.'); }
    finally { setSaving(false); }
  }

  async function saveUnit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setActionError('');
    const form = new FormData(event.currentTarget);
    try {
      const payload = { reference: form.get('reference'), nom: form.get('nom'), etage: form.get('etage'), statut: form.get('statut') };
      if (unitModal?.existing?._id) await updateHotelUnit(unitModal.existing._id, payload, token);
      else await createHotelUnit({ ...payload, chambreId: unitModal.category._id }, token);
      setUnitModal(null); await load();
    } catch (e) { setActionError(e instanceof Error ? e.message : 'Impossible de sauvegarder l’unité.'); }
    finally { setSaving(false); }
  }

  if (loading && !data) return <main className="hotel-dashboard-page"><div className="hotel-dashboard-loading"><RefreshCw size={20} /> Chargement de votre espace hôtelier…</div></main>;
  if (error && !data) return <main className="hotel-dashboard-page"><div className="hotel-dashboard-error"><strong>Impossible de charger l’espace hôtelier.</strong><p>{error}</p><Button onClick={() => load()}>Réessayer</Button></div></main>;
  if (!data) return null;

  const { hotel, stats, categories, unites, calendar } = data;
  const nextActions = reservations.filter((r: any) => ['en_attente_paiement', 'confirmee', 'arrivee', 'en_sejour'].includes(r.statut)).slice(0, 5);

  return <main className="hotel-dashboard-page">
    <header className="hotel-dashboard-header">
      <div>
        <span className="section-eyebrow">Espace Hôtel</span>
        <h1>{hotel.nom}</h1>
        <p><MapPin size={14} /> {[hotel.localisation?.ville, hotel.localisation?.quartier].filter(Boolean).join(' · ') || 'Localisation à compléter'}</p>
      </div>
      <div className="hotel-dashboard-actions"><Button variant="secondary" onClick={() => load()}><RefreshCw size={16} /> Actualiser</Button><Button onClick={() => setCategoryModal(true)}><Plus size={16} /> Hébergement</Button></div>
    </header>

    <nav className="hotel-dashboard-tabs" aria-label="Navigation de l'espace hôtelier">
      {([['overview','Vue d’ensemble'],['reservations','Réservations'],['hebergements','Hébergements'],['calendrier','Calendrier']] as [Tab,string][]).map(([key,label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}
    </nav>

    {actionError && <div className="hotel-dashboard-action-error">{actionError}</div>}

    {tab === 'overview' && <>
      <section className="hotel-dashboard-kpis">
        <article><span>Arrivées</span><strong>{stats.arriveesAujourdhui}</strong><small>aujourd’hui</small></article>
        <article><span>Départs</span><strong>{stats.departsAujourdhui}</strong><small>aujourd’hui</small></article>
        <article><span>En séjour</span><strong>{stats.enSejour}</strong><small>actuellement</small></article>
        <article><span>Paiements</span><strong>{stats.aConfirmer}</strong><small>à surveiller</small></article>
      </section>
      <div className="hotel-dashboard-grid">
        <section className="hotel-panel">
          <div className="hotel-panel-head"><div><span className="section-eyebrow">Aujourd’hui</span><h2>Les mouvements du jour</h2></div><button onClick={() => setTab('reservations')}>Voir tout</button></div>
          <div className="hotel-reservation-list">{todayReservations.length ? todayReservations.map((r: any) => <ReservationRow key={r._id} reservation={r} onStatus={changeStatus} />) : <EmptyState text="Aucun mouvement prévu aujourd’hui." />}</div>
        </section>
        <aside className="hotel-panel">
          <div className="hotel-panel-head"><div><span className="section-eyebrow">Établissement</span><h2>État de l’offre</h2></div></div>
          <div className="hotel-summary-list">
            <div><Hotel size={17}/><span>Catégories</span><strong>{stats.categories}</strong></div>
            <div><BedDouble size={17}/><span>Unités</span><strong>{stats.unites}</strong></div>
            <div><Clock3 size={17}/><span>Opérationnelles</span><strong>{stats.unitesOperationnelles}</strong></div>
            <div><Users size={17}/><span>Réservations actives</span><strong>{stats.reservationsPeriode}</strong></div>
          </div>
          <div className="hotel-location-note"><MapPin size={16}/><div><strong>{hotel.localisation?.quartier || 'Quartier non renseigné'}</strong><p>{hotel.localisation?.indicationsAcces || 'Ajoutez des indications d’accès détaillées pour vos clients.'}</p></div></div>
        </aside>
      </div>
      <section className="hotel-panel"><div className="hotel-panel-head"><div><span className="section-eyebrow">Prochaines actions</span><h2>Réservations à suivre</h2></div></div><div className="hotel-reservation-list">{nextActions.length ? nextActions.map((r: any) => <ReservationRow key={r._id} reservation={r} onStatus={changeStatus} />) : <EmptyState text="Aucune réservation active à traiter." />}</div></section>
    </>}

    {tab === 'reservations' && <section className="hotel-panel"><div className="hotel-panel-head"><div><span className="section-eyebrow">Exploitation</span><h2>Réservations</h2><p>Les états viennent du backend, pas d’un état local de l’interface.</p></div><input type="date" value={date} onChange={(e) => { setDate(e.target.value); load(e.target.value); }} /></div><div className="hotel-reservation-list">{reservations.map((r: any) => <ReservationRow key={r._id} reservation={r} onStatus={changeStatus} detailed />)}{!reservations.length && <EmptyState text="Aucune réservation sur cette période." />}</div></section>}

    {tab === 'hebergements' && <section className="hotel-panel"><div className="hotel-panel-head"><div><span className="section-eyebrow">Inventaire</span><h2>Hébergements</h2><p>Une offre décrit ce qui est vendu. Les unités représentent les chambres physiques.</p></div><Button onClick={() => setCategoryModal(true)}><Plus size={16}/> Ajouter une offre</Button></div><div className="hotel-category-list">{categories.map((category: any) => <article key={category._id} className="hotel-category-card"><div className="hotel-category-main"><div><span className="hotel-category-type">{category.typeNormalise || category.type}</span><h3>{category.nom || category.type}</h3><p>{category.description || 'Description à compléter.'}</p></div><strong>{money(category.prixParNuit)} <small>/ nuit</small></strong></div><div className="hotel-category-meta"><span>Capacité {category.capacite}</span><span>{category.unites?.length || 0} unité(s) physique(s)</span><span>{category.unitesDisponiblesStructurelles || 0} opérationnelle(s)</span></div><div className="hotel-unit-list">{(category.unites || []).map((unit: any) => <button key={unit._id} onClick={() => setUnitModal({ category, existing: unit })}><span className={`hotel-unit-dot ${unit.statut}`} />{unit.reference}<small>{unit.nom || unit.etage || unit.statut}</small></button>)}<button className="hotel-add-unit" onClick={() => setUnitModal({ category, existing: null })}><Plus size={15}/> Ajouter une unité</button></div></article>)}{!categories.length && <EmptyState text="Créez votre première offre d’hébergement." />}</div></section>}

    {tab === 'calendrier' && <section className="hotel-panel"><div className="hotel-panel-head"><div><span className="section-eyebrow">Disponibilité</span><h2>Calendrier des 14 prochains jours</h2><p>Vue de pilotage préparée à partir des réservations réelles.</p></div><div className="hotel-calendar-nav"><button onClick={() => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() - 7); const next = d.toISOString().slice(0,10); setDate(next); load(next); }}><ChevronLeft size={17}/></button><input type="date" value={date} onChange={(e) => { setDate(e.target.value); load(e.target.value); }}/><button onClick={() => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + 7); const next = d.toISOString().slice(0,10); setDate(next); load(next); }}><ChevronRight size={17}/></button></div></div><div className="hotel-calendar-grid">{calendar.map((day: any) => <article key={day.date} className={day.date === date ? 'today' : ''}><strong>{dateLabel(day.date)}</strong><span>{day.reservations} réservation(s)</span><div><small>Arrivées {day.arrivees}</small><small>Départs {day.departs}</small></div><b>{day.unitesOccupees} unité(s) attribuée(s)</b></article>)}</div></section>}

    {categoryModal && <Modal title="Nouvelle offre d’hébergement" onClose={() => setCategoryModal(false)}><form className="hotel-form" onSubmit={saveCategory}><label>Nom<input name="nom" placeholder="Suite Deluxe" /></label><label>Type<select name="type" defaultValue="Suite">{['Simple','Double','Triple','Suite','Familiale','Dortoir','Studio','Appartement','Villa','Autre'].map((x) => <option key={x}>{x}</option>)}</select></label><label>Description<textarea name="description" placeholder="Ce que le client doit savoir avant de réserver." /></label><div className="hotel-form-two"><label>Prix / nuit<input name="prixParNuit" type="number" min="0" required /></label><label>Capacité<input name="capacite" type="number" min="1" defaultValue="2" /></label></div><div className="hotel-form-two"><label>Adultes<input name="capaciteAdultes" type="number" min="1" defaultValue="2" /></label><label>Enfants<input name="capaciteEnfants" type="number" min="0" defaultValue="0" /></label></div><label>Nombre d’unités prévues<input name="nombreUnites" type="number" min="1" defaultValue="1" /></label><Button disabled={saving}>{saving ? 'Enregistrement…' : 'Créer l’offre'}</Button></form></Modal>}
    {unitModal && <Modal title={unitModal.existing ? 'Modifier l’unité' : `Nouvelle unité · ${unitModal.category.nom || unitModal.category.type}`} onClose={() => setUnitModal(null)}><form className="hotel-form" onSubmit={saveUnit}><label>Référence<input name="reference" defaultValue={unitModal.existing?.reference || ''} placeholder="101" required /></label><label>Nom<input name="nom" defaultValue={unitModal.existing?.nom || ''} placeholder="Suite 101" /></label><label>Étage<input name="etage" defaultValue={unitModal.existing?.etage || ''} placeholder="1er étage" /></label><label>Statut<select name="statut" defaultValue={unitModal.existing?.statut || 'disponible'}><option value="disponible">Disponible</option><option value="maintenance">Maintenance</option><option value="hors_service">Hors service</option></select></label><Button disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer l’unité'}</Button></form></Modal>}
  </main>;
}

function ReservationRow({ reservation, onStatus, detailed = false }: { reservation: any; onStatus: (id: string, status: string) => void; detailed?: boolean }) {
  const client = reservation.client ? [reservation.client.prenom, reservation.client.nom].filter(Boolean).join(' ') : 'Client';
  const next = reservation.statut === 'confirmee' ? 'arrivee' : reservation.statut === 'arrivee' ? 'en_sejour' : reservation.statut === 'en_sejour' ? 'terminee' : null;
  return <article className="hotel-reservation-row"><div className="hotel-reservation-date"><strong>{new Date(reservation.dateArrivee).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</strong><span>→ {new Date(reservation.dateDepart).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span></div><div className="hotel-reservation-client"><strong>{client}</strong><span>{reservation.chambre?.nom || reservation.chambre?.type || 'Hébergement'} {reservation.uniteHebergement?.reference ? `· ${reservation.uniteHebergement.reference}` : ''}</span>{detailed && <small>{reservation.reservationReference || reservation._id}</small>}</div><div className="hotel-reservation-money"><strong>{money(reservation.montantTotal)}</strong><small>{reservation.nombreNuits} nuit(s)</small></div><Badge tone={statusTone[reservation.statut] || 'neutral'}>{statusLabel[reservation.statut] || reservation.statut}</Badge><div className="hotel-reservation-actions">{next && <Button onClick={() => onStatus(reservation._id, next)}>{next === 'arrivee' ? 'Arrivée' : next === 'en_sejour' ? 'Entrée en séjour' : 'Terminer'}</Button>}{!['terminee','annulee','expiree'].includes(reservation.statut) && <button className="hotel-cancel-action" onClick={() => onStatus(reservation._id, 'annulee')}>Annuler</button>}</div></article>;
}
function EmptyState({ text }: { text: string }) { return <div className="hotel-empty-state"><CalendarDays size={19}/><span>{text}</span></div>; }
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="hotel-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="hotel-modal"><button className="hotel-modal-close" onClick={onClose} aria-label="Fermer"><X size={18}/></button><span className="section-eyebrow">Espace Hôtel</span><h2>{title}</h2>{children}</section></div>; }
