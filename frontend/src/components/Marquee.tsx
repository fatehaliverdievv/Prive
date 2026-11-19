import { useEffect, useRef } from 'react';
import './Marquee.scss';

/** Drifts on its own, but scroll speed and direction steer it and skew the letters */
export default function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current!;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let x = 0, v = 0, last = window.scrollY, raf = 0;
    const tick = () => {
      const dy = window.scrollY - last; last = window.scrollY;
      v += (dy - v) * 0.08;
      const w = (el.firstElementChild as HTMLElement).offsetWidth;
      x -= calm ? 0.4 : 0.7 + v * 0.55;
      if (w) { if (x <= -w) x += w; if (x > 0) x -= w; }
      const skew = calm ? 0 : Math.max(-14, Math.min(14, -v * 0.7));
      el.style.transform = `translate3d(${x}px,0,0) skewX(${skew}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="marquee" aria-hidden>
      <div className="marquee__track" ref={track}>
        {[0, 1].map((k) => (
          <div className="marquee__row" key={k}>
            {row.map((t, i) => (<span key={i}>{t}<i /></span>))}
          </div>
        ))}
      </div>
    </div>
  );
}
