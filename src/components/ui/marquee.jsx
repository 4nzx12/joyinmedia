import { cn } from '../../lib/utils.js';
import { useInView, usePageVisible } from '../../hooks/useBrowserState.js';
import './marquee.css';

export function Marquee({ children, className, reverse = false, pauseOnHover = true, vertical = false, repeat = 2, style, ...props }) {
  const [ref, inView] = useInView({ threshold: 0 });
  const visible = usePageVisible();
  return <div ref={ref} {...props} className={cn('component-marquee', vertical && 'component-marquee-vertical', reverse && 'component-marquee-reverse', pauseOnHover && 'component-marquee-pause', className)} style={{ ...style, '--marquee-play': inView && visible ? 'running' : 'paused' }}>
    {Array.from({ length: Math.max(2, repeat) }, (_, index) => <div key={index} className="component-marquee-track" aria-hidden={index > 0 ? true : undefined} inert={index > 0 ? true : undefined}>{children}</div>)}
  </div>;
}
