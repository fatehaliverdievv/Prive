import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

/** Card that "stands up" out of the page: tilts from lying flat to upright while scrolling into view, with depth and a soft shadow */
export default function Depth({ children, className, from = 42 }: { children: ReactNode; className?: string; from?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 105%', 'start 40%'] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.4 });
  const rotateX = useTransform(p, [0, 1], [from, 0]);
  const y = useTransform(p, [0, 1], [140, 0]);
  const scale = useTransform(p, [0, 1], [0.88, 1]);
  const opacity = useTransform(p, [0, 0.45], [0, 1]);
  return (
    <div ref={ref} className={className} style={{ perspective: 1300 }}>
      <motion.div style={{ rotateX, y, scale, opacity, transformOrigin: '50% 100%', transformStyle: 'preserve-3d' }}>{children}</motion.div>
    </div>
  );
}
