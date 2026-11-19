import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { adm, auth, ApiError } from '../api';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errs, setErrs] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const er: typeof errs = {};
    if (!email.trim()) er.email = 'E-poçtu yazın';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) er.email = 'E-poçt düzgün deyil';
    if (!password) er.password = 'Parolu yazın';
    setErrs(er);
    if (er.email || er.password) return;
    setBusy(true);
    try {
      const r = await adm<{ token: string }>('/auth/login', { method: 'POST', json: { email: email.trim(), password } });
      auth.set(r.token); nav('/admin', { replace: true });
    } catch (x) { setErrs({ form: (x as ApiError).message }); }
    finally { setBusy(false); }
  };

  return (
    <div className="a-login">
      <aside className="a-login__art">
        <img src="/images/hero.webp" alt="" />
        <div className="a-login__shade" />
        <img className="a-login__logo" src="/images/logo-light.png" alt="Privé by Peaktour" />
        <p>Azı çoxdur.</p>
      </aside>
      <main className="a-login__main">
        <form onSubmit={submit} noValidate className="a-login__form">
          <p className="a-eyebrow">İdarəetmə paneli</p>
          <h1>Xoş gəlmisiniz</h1>
          <p className="a-login__sub">Davam etmək üçün hesabınıza daxil olun.</p>

          <div className={`a-field ${errs.email ? 'has-err' : ''}`}>
            <label><span>E-poçt</span></label>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrs((s) => ({ ...s, email: undefined, form: undefined })); }} autoComplete="username" autoFocus className={errs.email ? 'bad' : ''} placeholder="admin@peaktour.az" />
            {errs.email && <p className="a-err">{errs.email}</p>}
          </div>
          <div className={`a-field ${errs.password ? 'has-err' : ''}`}>
            <label><span>Parol</span><button type="button" className="a-link" onClick={() => setShow((s) => !s)}>{show ? 'Gizlət' : 'Göstər'}</button></label>
            <input type={show ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setErrs((s) => ({ ...s, password: undefined, form: undefined })); }} autoComplete="current-password" className={errs.password ? 'bad' : ''} />
            {errs.password && <p className="a-err">{errs.password}</p>}
          </div>
          {errs.form && <div className="a-alert" role="alert">{errs.form}</div>}
          <button className="a-btn primary lg" disabled={busy}>{busy ? 'Yoxlanılır…' : 'Daxil ol'}</button>
          <a className="a-login__back" href="/az">← Sayta qayıt</a>
        </form>
      </main>
    </div>
  );
}
