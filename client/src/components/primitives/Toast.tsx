import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Toast({ tone = 'info', title, message, onClose }: { tone?: 'info' | 'success' | 'error'; title: string; message?: string; onClose?: () => void }) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'error' ? AlertCircle : Info
  return <div className={`toast toast-${tone}`} role="status"><Icon size={19} /><div><strong>{title}</strong>{message && <p>{message}</p>}</div>{onClose && <button className="toast-close" aria-label="Fermer" onClick={onClose}><X size={16} /></button>}</div>
}
