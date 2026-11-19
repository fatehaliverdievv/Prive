import { useEffect, useState, type ReactNode } from 'react';

/* ───────── toasts ───────── */
type ToastItem = { id: number; msg: string; type: 'ok' | 'err' };
const toastBus = new Set<(t: ToastItem) => void>();
let tid = 0;
export const toast = (msg: string, type: 'ok' | 'err' = 'ok') => toastBus.forEach((f) => f({ id: ++tid, msg, type }));

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    const on = (t: ToastItem) => { setItems((s) => [...s, t]); setTimeout(() => setItems((s) => s.filter((x) => x.id !== t.id)), t.type === 'err' ? 6000 : 3200); };
    toastBus.add(on); return () => { toastBus.delete(on); };
  }, []);
  return <div className="a-toasts">{items.map((t) => <div key={t.id} className={`a-toast ${t.type}`} role="status">{t.msg}</div>)}</div>;
}

/* ───────── confirm dialog (promise based) ───────── */
interface ConfirmOpts { title: string; text?: string; ok?: string; danger?: boolean }
let askConfirm: ((o: ConfirmOpts) => Promise<boolean>) | null = null;
export const confirmDialog = (o: ConfirmOpts) => (askConfirm ? askConfirm(o) : Promise.resolve(window.confirm(o.title)));

export function ConfirmHost() {
  const [st, setSt] = useState<{ o: ConfirmOpts; res: (v: boolean) => void } | null>(null);
  useEffect(() => { askConfirm = (o) => new Promise((res) => setSt({ o, res })); return () => { askConfirm = null; }; }, []);
  useEffect(() => {
    if (!st) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close(false); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });
  const close = (v: boolean) => { st?.res(v); setSt(null); };
  if (!st) return null;
  return (
    <div className="a-modal" onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
      <div className="a-dialog" role="alertdialog" aria-modal>
        <h3>{st.o.title}</h3>
        {st.o.text && <p>{st.o.text}</p>}
        <div className="a-dialog__act">
          <button className="a-btn ghost" onClick={() => close(false)}>Ləğv et</button>
          <button className={`a-btn ${st.o.danger ? 'danger' : 'primary'}`} onClick={() => close(true)} autoFocus>{st.o.ok || 'Təsdiqlə'}</button>
        </div>
      </div>
    </div>
  );
}

/* ───────── drawer ───────── */
export function Drawer({ open, title, onClose, children, footer, wide }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="a-modal side" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className={`a-drawer ${wide ? 'wide' : ''}`} role="dialog" aria-modal aria-label={title}>
        <header><h2>{title}</h2><button className="a-x" onClick={onClose} aria-label="Bağla">×</button></header>
        <div className="a-drawer__body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </aside>
    </div>
  );
}

/* ───────── small pieces ───────── */
export const Spinner = () => <div className="a-spin" aria-label="Yüklənir" />;
export const Empty = ({ children }: { children: ReactNode }) => <div className="a-empty">{children}</div>;
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className={`a-switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}><i /></button>
  );
}
export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="a-head">
      <div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      {actions && <div className="a-head__act">{actions}</div>}
    </div>
  );
}
