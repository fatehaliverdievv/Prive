import { motion } from 'framer-motion';

/** Word-by-word masked reveal */
export default function SplitText({ text, className, delay = 0, as = 'h2', immediate = false }: {
  text: string; className?: string; delay?: number; as?: 'h1' | 'h2' | 'h3' | 'p'; immediate?: boolean;
}) {
  const Tag = motion[as];
  const words = text.split(' ');
  return (
    <Tag className={className} aria-label={text}
      initial="hidden" {...(immediate ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, margin: '-10% 0px' } })}
      transition={{ staggerChildren: 0.07, delayChildren: delay }}>
      {words.map((w, i) => (
        <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.12em', perspective: 700 }}>
          <motion.span style={{ display: 'inline-block', transformOrigin: '50% 100%' }} variants={{ hidden: { y: '105%', rotateX: -80, rotate: 3 }, show: { y: 0, rotateX: 0, rotate: 0 } }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}>
            {w}{i < words.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
