import { img } from '../../lib/api';
import { adm, fmtDate, fmtSize, ApiError } from '../api';
import { Dropzone, useMedia } from '../MediaPicker';
import { Empty, PageHead, Spinner, confirmDialog, toast } from '../ui';

export default function Media() {
  const { files, load } = useMedia();
  const copy = async (u: string) => {
    const full = location.origin + u;
    try { await navigator.clipboard.writeText(full); toast('Link kopyalandı'); } catch { toast(full); }
  };
  const remove = async (name: string) => {
    if (!(await confirmDialog({ title: 'Şəkil silinsin?', text: 'Bu şəkli istifadə edən yerlər boş qala bilər.', ok: 'Sil', danger: true }))) return;
    try { await adm(`/media/${name}`, { method: 'DELETE' }); toast('Silindi'); load(); } catch (e) { toast((e as ApiError).message, 'err'); }
  };
  return (
    <>
      <PageHead title="Şəkil kitabxanası" sub="Yüklədiyiniz şəkillər. İstənilən yerdə “Şəkil seç” ilə istifadə edə bilərsiniz." />
      <Dropzone onUploaded={() => load()} />
      {files === null ? <Spinner /> : files.length === 0 ? <Empty>Hələ şəkil yüklənməyib.</Empty> : (
        <div className="a-media">
          {files.map((f) => (
            <figure key={f.name}>
              <img src={img(f.url)} alt="" loading="lazy" />
              <figcaption><span>{fmtSize(f.size)} · {fmtDate(f.date)}</span>
                <div><button className="a-link" onClick={() => copy(f.url)}>Kopyala</button><button className="a-link danger" onClick={() => remove(f.name)}>Sil</button></div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </>
  );
}
