// Adapted from Hammam Khairi's supplied 21st.dev component source.
import { useEffect, useRef } from 'react';
import { m } from 'motion/react';
import { cn } from '../../lib/utils.js';
import { useInView, usePageVisible, useReducedMotion } from '../../hooks/useBrowserState.js';

const DEFAULT_COLORS = ['var(--hero-surface)', 'var(--hero-surface)', '#ffbe84', '#f8862e', '#dc5a13', '#9e3009'];
const DEFAULT_STOPS = [12, 30, 48, 64, 82, 100];

export default function AnimatedGradientBackground({
  startingGap = 100,
  Breathing = true,
  gradientColors = DEFAULT_COLORS,
  gradientStops = DEFAULT_STOPS,
  animationSpeed = 0.045,
  breathingRange = 14,
  containerStyle = {},
  containerClassName = '',
  topOffset = 15,
}) {
  const gradientRef = useRef(null);
  const phase = useRef(0);
  const [containerRef, inView] = useInView({ threshold: 0 });
  const visible = usePageVisible();
  const reducedMotion = useReducedMotion();

  if (gradientColors.length !== gradientStops.length) {
    throw new Error('Gradient colors and stops must have the same length.');
  }
  const stops = gradientStops.map((stop, index) => `${gradientColors[index]} ${stop}%`).join(', ');
  const background = width => `radial-gradient(${width}% ${width + topOffset}% at 50% 20%, ${stops})`;

  useEffect(() => {
    const element = gradientRef.current;
    if (!Breathing || reducedMotion || !inView || !visible || animationSpeed <= 0) return;
    let frame = 0;
    let lastTime = 0;
    function animate(time) {
      if (!lastTime) lastTime = time;
      const delta = time - lastTime;
      if (delta >= 1000 / 30) {
        // Time-based breathing has the same speed at different refresh rates.
        phase.current += Math.min(delta, 100) * 0.001 * animationSpeed * 10;
        lastTime = time;
        const width = startingGap + Math.sin(phase.current) * breathingRange;
        element.style.backgroundImage = `radial-gradient(${width}% ${width + topOffset}% at 50% 20%, ${stops})`;
      }
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [Breathing, reducedMotion, inView, visible, animationSpeed, startingGap, breathingRange, topOffset, stops]);

  return <m.div ref={containerRef} initial={false} className={cn('animated-gradient-background', containerClassName)} aria-hidden="true">
    <div ref={gradientRef} className="animated-gradient-surface" style={{ ...containerStyle, backgroundImage: background(startingGap) }} />
  </m.div>;
}
