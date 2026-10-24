import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, Loader2, SearchX } from 'lucide-react'

export type StatusTone = 'info' | 'success' | 'warning' | 'error' | 'neutral'

export function Badge({ children, tone = 'info' }: { children: ReactNode; tone?: StatusTone }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function Avatar({ name, src, size = 'md' }: { name?: string; src?: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = (name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
  return <span className={`avatar avatar-${size}`} aria-label={name}>{src ? <img src={src} alt="" /> : initials}</span>
}

export function Spinner({ label = 'Chargement…' }: { label?: string }) {
  return <span className="spinner" role="status" aria-label={label}><Loader2 size={18} /></span>
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" />
}

export function EmptyState({ icon = <SearchX size={24} />, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return <div className="state-card empty-state"><div className="state-icon">{icon}</div><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>
}

export function ErrorState({ title = 'Une erreur est survenue', description = 'Réessayez dans un instant.', action }: { title?: string; description?: string; action?: ReactNode }) {
  return <div className="state-card error-state"><div className="state-icon"><AlertCircle size={24} /></div><h3>{title}</h3><p>{description}</p>{action}</div>
}

export function SuccessState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="state-card success-state"><div className="state-icon"><CheckCircle2 size={24} /></div><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>
}

export function InfoState({ title, description }: { title: string; description?: string }) {
  return <div className="state-card info-state"><div className="state-icon"><Info size={24} /></div><h3>{title}</h3>{description && <p>{description}</p>}</div>
}
