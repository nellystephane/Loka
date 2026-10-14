import { useEffect, useState, type FormEvent } from 'react';
import { Banknote, Clock3, RefreshCw, Send, ShieldCheck } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';
type RefundableTransaction = { _id: string; contexte?: { type?: string; id?: string }; montant: number; devise?: string; createdAt?: string; montantDejaDemande: number; montantRemboursable: number };
type RefundRequest = { _id: string; transactionPaiement?: { _id?: string; contexte?: { type?: string }; montant?: number; devise?: string; statut?: string } | null; montant: number; motif: string; statut: string; createdAt?: string; erreur?: string };
const refundStatus: Record<string, string> = { demande: 'Demande reçue', en_cours: 'En cours de traitement', réussi: 'Remboursement confirmé', échoué: 'Échec du traitement', annulé: 'Demande annulée' };
const contextName: Record<string, string> = { panier_boutique: 'Commande boutique', panier_restaurant: 'Commande restaurant', panier_multi: 'Commande multi-vendeurs', offre: 'Proposition négociée', reservation: 'Réservation hôtel', reservation_restaurant: 'Réservation restaurant', livraison: 'Livraison' };
const money = (amount: number, currency = 'XOF') => `${Number(amount || 0).toLocaleString('fr-FR')} ${currency === 'XOF' ? 'FCFA' : currency}`;

export function RefundsPage() {
  const token = localStorage.getItem('token');
  const [transactions, setTransactions] = useState<RefundableTransaction[]>([]);
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [amount, setAmount] = useState('');
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const selected = transactions.find((item) => item._id === selectedId);

  async function request(path: string, init: RequestInit = {}) {
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || 'Service de remboursement indisponible.');
    return body;
  }
  async function load() {
    if (!token) { setError('Connectez-vous pour consulter ou demander un remboursement.'); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [eligible, history] = await Promise.all([
        request('/api/remboursements/transactions/miennes'),
        request('/api/remboursements/moi'),
      ]);
      const nextTransactions = Array.isArray(eligible) ? eligible : [];
      setTransactions(nextTransactions);
      setRequests(Array.isArray(history) ? history : []);
      setSelectedId((current) => nextTransactions.some((item: RefundableTransaction) => item._id === current) ? current : nextTransactions[0]?._id || '');
      setAmount((current) => current || (nextTransactions[0]?.montantRemboursable ? String(nextTransactions[0].montantRemboursable) : ''));
    } catch (e) { setError(e instanceof Error ? e.message : 'Impossible de charger vos remboursements.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) { setError('Sélectionnez un paiement éligible.'); return; }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > selected.montantRemboursable) { setError(`Le montant doit être compris entre 1 et ${money(selected.montantRemboursable)}.`); return; }
    setBusy(true); setError(''); setSuccess('');
    try {
      await request('/api/remboursements', { method: 'POST', body: JSON.stringify({ transactionId: selected._id, montant: value, motif }) });
      setSuccess('Votre demande a été enregistrée. Cela ne signifie pas encore que le remboursement a été exécuté : le statut sera mis à jour après vérification.');
      setMotif(''); setAmount('');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'La demande n’a pas pu être enregistrée.'); }
    finally { setBusy(false); }
  }

  if (!token) return <main className="refunds-page"><div className="commerce-empty"><Banknote size={24}/><h2>Mes remboursements</h2><p>Connectez-vous pour consulter vos demandes et les paiements éligibles.</p><a className="button button-primary" href={`/connexion?next=${encodeURIComponent('/remboursements')}`}>Se connecter</a></div></main>;
  return <main className="refunds-page">
    <header className="refunds-hero"><span className="section-eyebrow"><ShieldCheck size={15}/> Paiements et remboursements</span><h2>Mes demandes de remboursement</h2><p>Seuls les paiements confirmés dont le montant n’est pas déjà engagé dans une demande sont proposés. Une demande enregistrée n’est pas un remboursement exécuté.</p></header>
    {error && <div className="commerce-inline-state error" role="alert">{error}</div>}
    {success && <div className="refund-success" role="status">{success}</div>}
    <div className="refunds-layout">
      <section className="account-panel refunds-request-panel"><div className="reservation-detail-section-title"><Send size={19}/><h2>Demander un remboursement</h2></div>
        {loading ? <div className="commerce-empty" role="status">Vérification des paiements éligibles…</div> : transactions.length === 0 ? <div className="commerce-empty"><Banknote size={23}/><h3>Aucun paiement éligible</h3><p>Les paiements non confirmés, déjà intégralement remboursés ou couverts par une demande en cours ne sont pas proposés.</p></div> : <form className="refund-form" onSubmit={submit}>
          <label>Paiement concerné<select value={selectedId} onChange={(event) => { setSelectedId(event.target.value); const tx = transactions.find((item) => item._id === event.target.value); setAmount(tx ? String(tx.montantRemboursable) : ''); }} required>{transactions.map((tx) => <option key={tx._id} value={tx._id}>{contextName[tx.contexte?.type || ''] || 'Paiement'} · {money(tx.montant)} · remboursable {money(tx.montantRemboursable)}</option>)}</select></label>
          {selected && <div className="refund-transaction-summary"><span>Montant payé</span><strong>{money(selected.montant)}</strong><span>Déjà demandé / engagé</span><strong>{money(selected.montantDejaDemande)}</strong><span>Maximum disponible</span><strong>{money(selected.montantRemboursable)}</strong></div>}
          <label>Montant demandé<input type="number" min="1" max={selected?.montantRemboursable || undefined} step="1" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
          <label>Motif<textarea value={motif} onChange={(event) => setMotif(event.target.value)} maxLength={500} rows={4} required placeholder="Expliquez la raison de votre demande." /></label>
          <button className="button button-primary" type="submit" disabled={busy || !selected}>{busy ? 'Enregistrement…' : 'Envoyer la demande'} <Send size={16}/></button>
        </form>}
      </section>
      <section className="account-panel refunds-history-panel"><div className="refund-history-header"><div className="reservation-detail-section-title"><Clock3 size={19}/><h2>Historique</h2></div><button className="button button-secondary" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15}/> Actualiser</button></div>
        {loading ? <div className="commerce-empty" role="status">Chargement de l’historique…</div> : requests.length === 0 ? <div className="commerce-empty"><Clock3 size={23}/><h3>Aucune demande enregistrée</h3><p>Les demandes envoyées apparaîtront ici avec leur statut réel.</p></div> : <div className="refund-list">{requests.map((item) => <article className="refund-item" key={item._id}><div className="refund-item-top"><span className={`badge ${item.statut === 'réussi' ? 'badge-success' : ['échoué','annulé'].includes(item.statut) ? 'badge-neutral' : 'badge-warning'}`}>{refundStatus[item.statut] || item.statut}</span><small>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : 'Date non disponible'}</small></div><strong>{money(item.montant, item.transactionPaiement?.devise)}</strong><p>{item.motif}</p><small>{contextName[item.transactionPaiement?.contexte?.type || ''] || 'Paiement'}{item.transactionPaiement?.statut ? ` · paiement : ${item.transactionPaiement.statut}` : ''}</small>{item.erreur && <p className="refund-item-error">{item.erreur}</p>}</article>)}</div>}
      </section>
    </div>
  </main>;
}
