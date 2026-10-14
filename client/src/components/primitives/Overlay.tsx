import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from 'react'
import { X } from 'lucide-react'

export function IconButton({ label, children, onClick, disabled = false, className = '' }: { label: string; children: ReactNode; onClick?: MouseEventHandler<HTMLButtonElement>; disabled?: boolean; className?: string } & Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>) {
  return <button className={`icon-button ${className}`.trim()} type="button" aria-label={label} onClick={onClick} disabled={disabled}>{children}</button>
}

export function Modal({ open, title, children, onClose, footer }: { open: boolean; title: string; children: ReactNode; onClose: () => void; footer?: ReactNode }) {
  if (!open) return null
  return <div className="overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header className="modal-header"><h2 id="modal-title">{title}</h2><IconButton label="Fermer" onClick={onClose}><X size={19} /></IconButton></header>
      <div className="modal-body">{children}</div>
      {footer && <footer className="modal-footer">{footer}</footer>}
    </section>
  </div>
}

export function Sheet({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null
  return <div className="sheet-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div className="sheet-handle" /><header className="modal-header"><h2 id="sheet-title">{title}</h2><IconButton label="Fermer" onClick={onClose}><X size={19} /></IconButton></header><div className="sheet-body">{children}</div></section></div>
}
