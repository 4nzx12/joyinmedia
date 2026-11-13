import { m } from 'motion/react';
import { cn } from '../../lib/utils.js';
import { useInView, usePageVisible, useReducedMotion } from '../../hooks/useBrowserState.js';

export function ShimmerText({ children, className, duration = 2.4, delay = 1, spread = 70 }) {
  const [ref, inView] = useInView();
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  const animate = inView && visible && !reduced;
  return <m.span ref={ref} className={cn('shimmer-text', className)} style={{ backgroundSize: `${spread}% 200%` }} initial={false}
    animate={animate ? { backgroundPositionX: ['-150%', '250%'] } : { backgroundPositionX: '250%' }}
    transition={animate ? { duration, delay, repeat: Infinity, repeatDelay: 3, ease: 'linear' } : { duration: 0 }}>
    {children}
  </m.span>;
}
export default ShimmerText;
