import { useEffect, useState } from 'react';
import { AlertCircle, ClipboardCheck, LifeBuoy, RefreshCw, Send } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';
type Dispute = { _id: string; motif: string; description: string; statut: string; contexte?: { type?: string; id?: string | null }; createdAt?: string; traitement?: { note?: string } };
const statusLabels: Record<string, string> = { ouvert: 'Ouvert', en_cours: 'En cours de traitement', resolu: 'Résolu', rejete: 'Clôturé sans suite' };
const contextLabels: Record<string, string> = { commande: 'Commande boutique', commande_restaurant: 'Commande restaurant', livraison: 'Livraison', annonce: 'Annonce ou service', utilisateur: 'Utilisateur', autre: 'Autre problème' };

export function SupportPage() {
  const token = localStorage.getItem('token');
  const query = new URLSearchParams(window.location.search);
  const [items, setItems] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [contextType, setContextType] = useState(contextLabels[query.get('contextType') || ''] ? query.get('contextType')! : 'autre');
  const [contextId, setContextId] = useState(query.get('contextId') || '');
  const [motif, setMotif] = useState('');
  const [description, setDescription] = useState('');

  async function request(path: string, init: RequestInit = {}) {
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || 'Service de support indisponible.');
    return body;
  }
  async function load() {
    if (!token) { setError('Connectez-vous pour signaler un problème et consulter vos dossiers.'); setLoading(false); return; }
    setLoading(true); setError('');
    try { const result = await request('/api/litiges/moi'); setItems(Array.isArray(result) ? result : []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Impossible de charger vos dossiers.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) { setError('Connectez-vous pour envoyer un signalement.'); return; }
    if (contextId.trim() && !/^[a-f\d]{24}$/i.test(contextId.trim())) { setError('La référence doit être un identifiant valide de 24 caractères hexadécimaux, ou rester vide.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      await request('/api/litiges', { method: 'POST', body: JSON.stringify({ contexte: { type: contextType, ...(contextId.trim() ? { id: contextId.trim() } : {}) }, motif, description }) });
      setMessage('Votre signalement a été enregistré. Son statut est désormais suivi dans cette page.');
      setMotif(''); setDescription('');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Le signalement n’a pas pu être envoyé.'); }
    finally { setBusy(false); }
  }

  if (!token) return <main className="support-page"><div className="commerce-empty"><LifeBuoy size={25}/><h2>Support et signalements</h2><p>Connectez-vous pour envoyer un signalement et suivre son traitement.</p><a className="button button-primary" href={`/connexion?next=${encodeURIComponent('/litiges')}`}>Se connecter</a></div></main>;
  return <main className="support-page">
    <header className="support-hero"><span className="section-eyebrow"><LifeBuoy size={15}/> Assistance Loka</span><h2>Comment pouvons-nous vous aider ?</h2><p>Décrivez le problème rencontré. Votre signalement sera enregistré et son état restera consultable ici.</p></header>
    {error && <div className="commerce-inline-state error" role="alert"><AlertCircle size={17}/>{error}</div>}
    {message && <div className="support-success" role="status"><ClipboardCheck size={18}/>{message}</div>}
    <div className="support-layout">
      <section className="account-panel support-form-panel"><div className="reservation-detail-section-title"><Send size={19}/><h2>Envoyer un signalement</h2></div>
        <form className="support-form" onSubmit={submit}>
          <label>Type de problème<select value={contextType} onChange={(event) => setContextType(event.target.value)}>{Object.entries(contextLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Référence de l’objet concerné <span>(facultatif)</span><input value={contextId} onChange={(event) => setContextId(event.target.value)} placeholder="Identifiant de l’objet" /></label>
          <label>Motif<input value={motif} onChange={(event) => setMotif(event.target.value)} maxLength={120} required placeholder="Ex. commande non reçue" /></label>
          <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} required rows={5} placeholder="Expliquez ce qui s’est passé et ce que vous avez déjà essayé." /></label>
          <button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Envoi…' : 'Envoyer le signalement'} <Send size={16}/></button>
        </form>
      </section>
      <section className="account-panel support-history-panel"><div className="support-history-header"><div className="reservation-detail-section-title"><ClipboardCheck size={19}/><h2>Mes signalements</h2></div><button className="button button-secondary" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15}/> Actualiser</button></div>
        {loading ? <div className="commerce-empty" role="status">Chargement des signalements…</div> : items.length === 0 ? <div className="commerce-empty"><LifeBuoy size={23}/><h3>Aucun signalement</h3><p>Les demandes que vous envoyez apparaîtront ici avec leur état de traitement.</p></div> : <div className="support-list">{items.map((item) => <article className="support-item" key={item._id}><div className="support-item-top"><span className={`badge ${item.statut === 'resolu' ? 'badge-success' : item.statut === 'rejete' ? 'badge-neutral' : 'badge-warning'}`}>{statusLabels[item.statut] || item.statut}</span><small>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : 'Date non disponible'}</small></div><h3>{item.motif}</h3><p>{item.description}</p><small>{contextLabels[item.contexte?.type || 'autre'] || 'Autre problème'}{item.contexte?.id ? ` · Réf. ${String(item.contexte.id).slice(-8).toUpperCase()}` : ''}</small>{item.traitement?.note && <div className="support-admin-note"><strong>Réponse du support</strong><p>{item.traitement.note}</p></div>}</article>)}</div>}
      </section>
    </div>
  </main>;
}
