import { useEffect, useState, type MouseEventHandler, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function IconButton({ label, children, onClick, disabled = false, className = '' }: { label: string; children: ReactNode; onClick?: MouseEventHandler<HTMLButtonElement>; disabled?: boolean; className?: string }) {
  return <button className={`icon-button ${className}`.trim()} type="button" aria-label={label} onClick={onClick} disabled={disabled}>{children}</button>
}

function usePresence(open:boolean, duration=180){
 const [mounted,setMounted]=useState(open);const [closing,setClosing]=useState(false);
 useEffect(()=>{let timer:ReturnType<typeof setTimeout>|undefined;if(open){setMounted(true);setClosing(false);}else if(mounted){setClosing(true);timer=setTimeout(()=>{setMounted(false);setClosing(false)},duration);}return()=>{if(timer)clearTimeout(timer)}},[open,duration]);
 return {mounted,closing};
}

export function Modal({ open, title, children, onClose, footer }: { open: boolean; title: string; children: ReactNode; onClose: () => void; footer?: ReactNode }) {
 const {mounted,closing}=usePresence(open);if(!mounted)return null;
 return <div className={`overlay ${closing?'is-closing':''}`} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header className="modal-header"><h2 id="modal-title">{title}</h2><IconButton label="Fermer" onClick={onClose}><X size={19} /></IconButton></header><div className="modal-body">{children}</div>{footer && <footer className="modal-footer">{footer}</footer>}</section></div>
}

export function Sheet({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
 const {mounted,closing}=usePresence(open);if(!mounted)return null;
 return <div className={`sheet-backdrop ${closing?'is-closing':''}`} onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div className="sheet-handle" /><header className="modal-header"><h2 id="sheet-title">{title}</h2><IconButton label="Fermer" onClick={onClose}><X size={19} /></IconButton></header><div className="sheet-body">{children}</div></section></div>
}
