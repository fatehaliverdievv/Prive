import { useCallback, useEffect, useMemo, useState } from 'react';
import { adm, fmtDate, ApiError } from '../api';
import { Drawer, Empty, PageHead, Spinner, confirmDialog, toast } from '../ui';

interface Inq { _id: string; name: string; phone?: string; email?: string; message?: string; note?: string; read?: boolean; createdAt: string }

export default function Inquiries({ onChange }: { onChange: () => void }) {
  const [rows, setRows] = useState<Inq[] | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'new'>('all');
  const [cur, setCur] = useState<Inq | null>(null);
  const [note, setNote] = useState('');
  const [noteErr, setNoteErr] = useState('');

  const load = useCallback(() => adm<Inq[]>('/inquiries').then(setRows).catch((e: ApiError) => { setRows([]); toast(e.message, 'err'); }), []);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => (rows || []).filter((r) => (filter === 'all' || !r.read) && (!q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase()))), [rows, q, filter]);
  const patch = async (r: Inq, body: Partial<Inq>) => {
    try {
      const u = await adm<Inq>(`/inquiries/${r._id}`, { method: 'PATCH', json: body });
      setRows((s) => (s || []).map((x) => (x._id === r._id ? u : x))); setCur((c) => (c && c._id === r._id ? u : c)); onChange();
      return true;
    } catch (e) { toast((e as ApiError).message, 'err'); return false; }
  };
  const open = (r: Inq) => { setCur(r); setNote(r.note || ''); setNoteErr(''); if (!r.read) patch(r, { read: true }); };
  const remove = async (r: Inq) => {
    if (!(await confirmDialog({ title: `${r.name} müraciəti silinsin?`, text: 'Geri qaytarmaq mümkün olmayacaq.', ok: 'Sil', danger: true }))) return;
    try { await adm(`/inquiries/${r._id}`, { method: 'DELETE' }); setCur(null); toast('Silindi'); load(); onChange(); } catch (e) { toast((e as ApiError).message, 'err'); }
  };
  const saveNote = async () => {
    if (note.length > 1000) return setNoteErr('Qeyd ən çox 1000 simvol ola bilər');
    if (cur && (await patch(cur, { note }))) toast('Qeyd saxlanıldı');
  };
  const csv = () => {
    const esc = (v?: string) => `"${(v || '').replace(/"/g, '""')}"`;
    const body = [['Tarix', 'Ad', 'Telefon', 'E-poçt', 'Mesaj', 'Qeyd'].join(','), ...(rows || []).map((r) => [fmtDate(r.createdAt, true), r.name, r.phone, r.email, r.message, r.note].map(esc).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + body], { type: 'text/csv;charset=utf-8' })); a.download = 'muracietler.csv'; a.click();
  };

  return (
    <>
      <PageHead title="Müraciətlər" sub="Saytdakı əlaqə formasından gələn sorğular." actions={<button className="a-btn ghost" onClick={csv} disabled={!rows?.length}>CSV yüklə</button>} />
      <div className="a-bar">
        <input className="a-search" placeholder="Ad, telefon, mesaj…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="a-seg">{([['all', 'Hamısı'], ['new', 'Yeni']] as const).map(([k, n]) => <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{n}</button>)}</div>
        <span className="a-count-lbl">{shown.length} / {rows?.length ?? 0}</span>
      </div>
      {rows === null ? <Spinner /> : shown.length === 0 ? <Empty>{rows.length ? 'Nəticə tapılmadı.' : 'Hələ müraciət yoxdur.'}</Empty> : (
        <div className="a-card flush">
          <table className="a-table">
            <thead><tr><th /><th>Ad</th><th>Əlaqə</th><th>Mesaj</th><th>Tarix</th><th /></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r._id} className={`click ${r.read ? '' : 'unread'}`} onClick={() => open(r)}>
                  <td className="w-dot"><i className={r.read ? '' : 'dot'} /></td>
                  <td data-label="Ad"><b>{r.name}</b></td>
                  <td data-label="Əlaqə"><span className="muted">{r.phone}{r.phone && r.email ? <br /> : ''}{r.email}</span></td>
                  <td data-label="Mesaj" className="clip">{r.message || <span className="muted">—</span>}</td>
                  <td data-label="Tarix">{fmtDate(r.createdAt, true)}</td>
                  <td className="a-actions" onClick={(e) => e.stopPropagation()}><button className="a-link danger" onClick={() => remove(r)}>Sil</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={!!cur} onClose={() => setCur(null)} title="Müraciət"
        footer={cur && <><button className="a-btn ghost" onClick={() => patch(cur, { read: !cur.read })}>{cur.read ? 'Oxunmamış et' : 'Oxunmuş et'}</button><button className="a-btn danger" onClick={() => remove(cur)}>Sil</button></>}>
        {cur && (
          <div className="a-detail">
            <h3>{cur.name}</h3><time>{fmtDate(cur.createdAt, true)}</time>
            <dl>
              <dt>Telefon</dt><dd>{cur.phone ? <a href={`tel:${cur.phone.replace(/[^\d+]/g, '')}`}>{cur.phone}</a> : '—'}</dd>
              <dt>E-poçt</dt><dd>{cur.email ? <a href={`mailto:${cur.email}`}>{cur.email}</a> : '—'}</dd>
            </dl>
            <p className="a-quote">{cur.message || 'Mesaj yazılmayıb.'}</p>
            <div className={`a-field ${noteErr ? 'has-err' : ''}`}>
              <label><span>Daxili qeyd</span><small className={`a-count ${note.length > 1000 ? 'over' : ''}`}>{note.length}/1000</small></label>
              <textarea rows={4} value={note} onChange={(e) => { setNote(e.target.value); setNoteErr(''); }} placeholder="Məs. zəng edildi, 20 noyabra təklif göndərilməlidir…" className={noteErr ? 'bad' : ''} />
              {noteErr && <p className="a-err">{noteErr}</p>}
              <button className="a-btn primary sm" style={{ marginTop: 10 }} onClick={saveNote} disabled={note === (cur.note || '')}>Qeydi saxla</button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
