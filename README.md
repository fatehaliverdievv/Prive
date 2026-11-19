# Peak Tour — premium travel site (React + TSX + SCSS + Vite · Node.js + MongoDB)

Loti.vacations-dan ilhamlanmış, **AZ / EN** dilli premium tur saytı.

```
peaktour/
├─ frontend/   React + TSX + SCSS + Vite  (sayt + /admin paneli)
└─ backend/    Node.js + Express + MongoDB (REST API, JWT, upload)
```

## İşə salmaq

```bash
# 1) Backend
cd backend
cp .env.example .env
npm install
npm run seed        # nümunə məlumat + admin istifadəçi
npm run dev         # http://localhost:5000

# 2) Frontend
cd ../frontend
npm install
npm run dev         # http://localhost:5173
```

- Sayt: `http://localhost:5173` (→ `/az` və ya `/en`)
- Admin: `http://localhost:5173/admin` — `admin@peaktour.az` / `Admin12345` (`.env`-dən dəyişin)
- Backend işləməsə belə sayt daxili nümunə məlumatla açılır (fallback).

## Nələr var
- **Preloader**: təyyarə xətt boyunca uçur, faiz sayır, pərdə yuxarı qalxır
- **Hero**: parallax + **3D qlobus** (three.js / R3F) + dövr edən təyyarə, siçana reaksiya
- **Sticky showcase 01–05**: scroll ilə 3D fırlanan poster kart
- **Hover-reveal destinasiyalar**: nəhəng yazı, fon şəkli dəyişir
- Tilt 3D kartlar, magnetic düymələr, custom kursor (label ilə), marquee, sayğaclar, Lenis smooth scroll
- Admin: Destinations · Hotels · News · Agencies · Inquiries (AZ/EN sahələr, şəkil yükləmə)
- Şrift: `font-family: NexaText, Arial, Helvetica, sans-serif`


## Admin panel (v2) — `/admin`
Sıfırdan yazılıb və saytın dizaynına uyğundur. **Saytdakı hər şey buradan dəyişir:**
- **İstiqamətlər, Otellər, Xəbərlər, Agentliklər** — AZ/EN mətnlər, slug (avtomatik), qalereya, sıra (▲▼), saytda göstər/gizlət, kopyala
- **Təcrübələr** — ana səhifədəki üfüqi 3D qalereya kartları
- **Mətnlər** — saytdakı *bütün* başlıq və yazılar (AZ/EN), “əsas mətnə qayıt” ilə
- **Ayarlar** — telefon, e-poçt, ünvan, sosial linklər, statistika rəqəmləri, hero/portal/about şəkilləri, SEO
- **Şəkillər** — yükləmə, kitabxana, silmək; hər yerdə “Şəkil seç”
- **Müraciətlər** — oxunmuş/oxunmamış, daxili qeyd, axtarış, CSV
- **Hesab** — parol dəyişmək, yeni admin əlavə etmək/silmək
- **Validasiya** — həm brauzerdə (dərhal), həm serverdə (zod): slug formatı, e-poçt, telefon, link, uzunluqlar, ulduz 1–5 və s.
- Təhlükəsizlik: giriş cəhdlərinə limit, forma spam limiti + honeypot, parol tələbləri, silinmiş admin dərhal girişi itirir

İlk giriş: `.env`-dəki `ADMIN_EMAIL` / `ADMIN_PASSWORD` (seed ilə yaranır). **Girişdən sonra parolu dəyişin.**
Verilənlər bazası adı: `.env`-də `MONGO_DB`.

## Yeni 3D / scroll effektləri (v2)
- **Hero (WebGL shader)**: foto siçanın altında maye dalğası verir, scroll sürətinə görə RGB ayrılması, qızılı toz hissəcikləri, kiçik qlobus
- **Portal**: qövs (arch) formalı pəncərə scroll ilə tam ekrana açılır (3D əyilmə + zoom)
- **3D halqa**: 6 istiqamət silindr şəklində düzülüb, scroll onu fırladır (`Showcase`)
- **Üfüqi 3D qalereya**: scroll ilə kartlar yana axır, hər kart mərkəzə yaxınlaşdıqca düzlənir (`Experience`)
- **Jelly siyahı**: istiqamət adının üstündə şəkil kursoru izləyir və sürətə görə əyilir
- **Uçuş xətti**: statistika bölməsində təyyarə scroll ilə cızılan xətt boyu uçur
- **Depth kartlar**, sürətə reaksiya verən **Marquee**, 3D hərf çevrilməsi (`SplitText`), Footer hərfləri, yuxarıda scroll bar

## Admin səhifə strukturu
Hər səhifə öz qovluğunda: `admin/pages/<Ad>/page.tsx` + `page.scss`.
Yeni bölmə üçün `CrudPage`-ə sahə siyahısı vermək kifayətdir.

## Şəkillər (AI ilə əvəz edin)
Şəkillər `frontend/public/images/*.webp` (turkiye, maldives, thailand, seychelles, italy, uae, hero, pool, transfer, journal).
Midjourney / Firefly / DALL·E ilə yaradıb eyni adla `.jpg` qoyun, ya da admin paneldən yükləyin.
Prompt nümunələri (16:10, photoreal, golden hour, no text, no watermark):

| Fayl | Prompt |
|---|---|
| hero | premium luxury travel editorial, elegant woman in white ruffled couture with red flowers, cinematic, soft light |
| turkiye | family at infinity pool of luxury hotel in Bodrum, turquoise Aegean sea, golden hour |
| maldives | overwater villa Maldives, crystal turquoise lagoon, aerial, calm |
| thailand | limestone cliffs, longtail boats, Krabi beach, vibrant tropical light |
| seychelles | granite boulders, white sand, turquoise water, Anse Source d'Argent |
| vietnam | Ha Long Bay at sunrise, emerald water, junk boats, mist |
| uae | Dubai skyline at dusk, desert foreground, warm pink sky |
| hotel-* | modern terraced luxury hotel facade, lush greenery, sea view |
| news-* | travel magazine editorial photo, lifestyle, bright natural light |

## Şrift
NexaText kommersial şriftdir. Lisenziyalı `.woff2` faylları `frontend/public/fonts/` qovluğuna qoyun
(`NexaText-Light/Regular/Bold/Heavy.woff2`). Yoxdursa Arial/Helvetica işləyir.

## Production
`cd frontend && npm run build` → `dist/`. API ayrı host-dadırsa `VITE_API_URL` verin, backend `CLIENT_URL`-ə saytın ünvanını yazın.
