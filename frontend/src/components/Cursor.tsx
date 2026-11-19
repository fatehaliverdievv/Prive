import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import './Cursor.scss';

/** Custom cursor: shrinks to a dot, grows to a labelled bubble on [data-cursor] */
export default function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 520, damping: 42, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 520, damping: 42, mass: 0.35 });
  const [label, setLabel] = useState('');
  const [hover, setHover] = useState(false);
  const [fine, setFine] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    setFine(true);
    const mv = (e: MouseEvent) => {
      x.set(e.clientX); y.set(e.clientY);
      const t = e.target as HTMLElement;
      const el = t.closest?.('[data-cursor]') as HTMLElement | null;
      setLabel(el?.dataset.cursor || '');
      setHover(!!el || !!t.closest?.('a, button, input, textarea, select'));
    };
    window.addEventListener('mousemove', mv);
    return () => window.removeEventListener('mousemove', mv);
  }, [x, y]);

  if (!fine) return null;
  return (
    <motion.div className="cursor" style={{ x: sx, y: sy }}>
      <div className={`cursor__dot ${label ? 'is-label' : hover ? 'is-hover' : ''}`}><span>{label}</span></div>
    </motion.div>
  );
}
