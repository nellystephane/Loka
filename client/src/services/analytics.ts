const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';
const SESSION_KEY = 'loka_analytics_session';

function sessionId() {
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s-${Date.now().toString(36)}`;
  }
}

export type LokaEventType = 'search' | 'view' | 'favorite' | 'share' | 'contact' | 'cart' | 'purchase' | 'reservation' | 'delivery_request' | 'completed' | 'click' | 'filter' | 'template_preview' | 'category_impression' | 'category_click' | 'category_ignored';

export function trackEvent(type: LokaEventType, cibleType?: string, cibleId?: string, contexte: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  const isObjectId = Boolean(cibleId && /^[a-f0-9]{24}$/i.test(cibleId));
  const eventContext = cibleId && !isObjectId ? { ...contexte, reference: cibleId } : contexte;
  const payload = { type, cibleType: cibleType || undefined, cibleId: isObjectId ? cibleId : undefined, contexte: eventContext, sessionId: sessionId() };
  try {
    void fetch(`${API_BASE}/api/analytics/evenements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined);
  } catch { /* Analytics never blocks a customer action. */ }
}

export function trackShare(cibleType: string, cibleId: string | undefined, canal: 'whatsapp' | 'facebook' | 'instagram' | 'tiktok' | 'qr' | 'copie' | 'natif' | 'autre') {
  const allowed = ['boutique', 'restaurant', 'hotel', 'livreur', 'annonce', 'produit', 'plat', 'chambre'];
  if (!allowed.includes(cibleType) || !cibleId || !/^[a-f0-9]{24}$/i.test(cibleId)) return;
  const payload = { cibleType, cibleId, canal, sessionId: sessionId(), referrer: typeof document !== 'undefined' ? document.referrer : '' };
  try {
    void fetch(`${API_BASE}/api/analytics/partages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true }).catch(() => undefined);
  } catch { /* Share tracking never blocks sharing. */ }
}
