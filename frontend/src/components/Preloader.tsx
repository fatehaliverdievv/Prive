import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import './Preloader.scss';

/** Plane flies along a line while the percentage counts up, then the curtain lifts */
export default function Preloader({ onDone }: { onDone: () => void }) {
  const [p, setP] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const start = performance.now();
    const dur = 2600;
    let raf = 0;
    let timer = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      setP(Math.round((1 - Math.pow(1 - k, 3)) * 100));
      if (k < 1) raf = requestAnimationFrame(tick);
      else timer = window.setTimeout(() => done.current(), 400);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, []);

  return (
    <motion.div className="pre" initial={{ clipPath: 'inset(0% 0 0% 0)' }}
      exit={{ clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}>
      <h1 className="pre__logo" aria-label="Privé DMC">
        <img src="/images/logo-dark.png" alt="" style={{ opacity: 0.12 + p * 0.0088, clipPath: `inset(0 ${100 - p}% 0 0)` }} />
      </h1>
      <div className="pre__line">
        <svg className="pre__plane" style={{ left: `${p}%` }} viewBox="0 0 24 24" width="28" height="28" aria-hidden>
          <path fill="currentColor" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" transform="rotate(90 12 12)" />
        </svg>
        <i style={{ width: `${p}%` }} />
      </div>
      <span className="pre__num">{p}%</span>
    </motion.div>
  );
}
