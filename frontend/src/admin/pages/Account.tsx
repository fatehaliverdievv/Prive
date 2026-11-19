import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { adm, fmtDate, ApiError } from '../api';
import { PageHead, Spinner, confirmDialog, toast } from '../ui';

interface Adm { _id: string; name: string; email: string; createdAt: string }
const strength = (p: string) => [p.length >= 8, /[a-z]/i.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p) || p.length >= 12].filter(Boolean).length;

function Field({ label, err, children }: { label: string; err?: string; children: React.ReactNode }) {
  return <div className={`a-field ${err ? 'has-err' : ''}`}><label><span>{label}</span></label>{children}{err && <p className="a-err">{err}</p>}</div>;
}

export default function Account({ me }: { me: { id: string; email: string; name: string } }) {
  const [pw, setPw] = useState({ current: '', next: '', again: '' });
  const [pe, setPe] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [admins, setAdmins] = useState<Adm[] | null>(null);
  const [nu, setNu] = useState({ name: '', email: '', password: '' });
  const [ne, setNe] = useState<Record<string, string>>({});

  const load = useCallback(() => adm<Adm[]>('/admins').then(setAdmins).catch((e: ApiError) => { setAdmins([]); toast(e.message, 'err'); }), []);
  useEffect(() => { load(); }, [load]);

  const changePw = async (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!pw.current) er.current = 'Cari parolu yazın';
    if (pw.next.length < 8) er.next = 'Parol ən azı 8 simvol olmalıdır';
    else if (!/[A-Za-z]/.test(pw.next) || !/\d/.test(pw.next)) er.next = 'Parolda hərf və rəqəm olmalıdır';
    if (pw.again !== pw.next) er.again = 'Parollar uyğun gəlmir';
    setPe(er); if (Object.keys(er).length) return;
    setBusy(true);
    try { await adm('/auth/password', { method: 'POST', json: { current: pw.current, next: pw.next } }); toast('Parol dəyişdirildi'); setPw({ current: '', next: '', again: '' }); }
    catch (x) { const a = x as ApiError; setPe(a.errors); toast(a.message, 'err'); }
    finally { setBusy(false); }
  };
  const addAdmin = async (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (nu.name.trim().length < 2) er.name = 'Ad ən azı 2 simvol olmalıdır';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(nu.email.trim())) er.email = 'E-poçt düzgün deyil';
    if (nu.password.length < 8 || !/[A-Za-z]/.test(nu.password) || !/\d/.test(nu.password)) er.password = 'Ən azı 8 simvol, hərf və rəqəm';
    setNe(er); if (Object.keys(er).length) return;
    try { await adm('/admins', { method: 'POST', json: nu }); toast('Admin əlavə olundu'); setNu({ name: '', email: '', password: '' }); load(); }
    catch (x) { const a = x as ApiError; setNe(a.errors); toast(a.message, 'err'); }
  };
  const del = async (a: Adm) => {
    if (!(await confirmDialog({ title: `${a.name} silinsin?`, text: 'Bu admin dərhal panelə girişini itirəcək.', ok: 'Sil', danger: true }))) return;
    try { await adm(`/admins/${a._id}`, { method: 'DELETE' }); toast('Silindi'); load(); } catch (x) { toast((x as ApiError).message, 'err'); }
  };
  const s = strength(pw.next);

  return (
    <>
      <PageHead title="Hesab" sub={`${me.name} · ${me.email}`} />
      <div className="a-two">
        <form className="a-card pad" onSubmit={changePw} noValidate>
          <div className="a-card__head"><h2>Parolu dəyiş</h2></div>
          <Field label="Cari parol" err={pe.current}><input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className={pe.current ? 'bad' : ''} /></Field>
          <Field label="Yeni parol" err={pe.next}>
            <input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className={pe.next ? 'bad' : ''} />
            <div className="a-meter" data-s={s}><i /><i /><i /><i /></div>
          </Field>
          <Field label="Yeni parol (təkrar)" err={pe.again}><input type="password" autoComplete="new-password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} className={pe.again ? 'bad' : ''} /></Field>
          <button className="a-btn primary" disabled={busy}>{busy ? 'Saxlanılır…' : 'Parolu yenilə'}</button>
        </form>

        <section className="a-card pad">
          <div className="a-card__head"><h2>Adminlər</h2></div>
          {admins === null ? <Spinner /> : (
            <ul className="a-list plain">
              {admins.map((a) => (
                <li key={a._id}><div><b>{a.name}{a._id === me.id && <em className="a-pill">siz</em>}</b><span>{a.email} · {fmtDate(a.createdAt)}</span></div>
                  {a._id !== me.id && <button className="a-link danger" onClick={() => del(a)}>Sil</button>}</li>
              ))}
            </ul>
          )}
          <form onSubmit={addAdmin} noValidate className="a-addadmin">
            <h3>Yeni admin</h3>
            <Field label="Ad" err={ne.name}><input value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} className={ne.name ? 'bad' : ''} /></Field>
            <Field label="E-poçt" err={ne.email}><input type="email" value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} className={ne.email ? 'bad' : ''} /></Field>
            <Field label="Parol" err={ne.password}><input type="password" autoComplete="new-password" value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} className={ne.password ? 'bad' : ''} /></Field>
            <button className="a-btn ghost">Admin əlavə et</button>
          </form>
        </section>
      </div>
    </>
  );
}
