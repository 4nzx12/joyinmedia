import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { animate as animateValue, AnimatePresence, m, useMotionValue, useTransform } from 'motion/react';
import { cn } from '../../lib/utils.js';
import { useInView, useMediaQuery, usePageVisible } from '../../hooks/useBrowserState.js';

// Adapted from the supplied CountUp component for JSX and the site's LazyMotion provider.
function OdometerDigit({ motionValue, place }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const element = ref.current;
    const measure = () => setHeight(element.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const y = useTransform(motionValue, value => {
    const digit = Math.floor(Math.abs(value) / place + 0.000001) % 10;
    return -digit * height;
  });

  return <span className="count-up-digit">
    <span ref={ref} className="count-up-measure">0</span>
    <m.span className="count-up-reel" style={{ y }}>
      {Array.from({ length: 10 }, (_, digit) => <span key={digit} style={{ height: height || '1em' }}>{digit}</span>)}
    </m.span>
  </span>;
}

const effects = {
  fade: {
    initial: { opacity: 0, scale: 0.7 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.7 },
    transition: { duration: 0.14, ease: 'easeOut' },
  },
  blur: {
    initial: up => ({ opacity: 0, filter: 'blur(8px)', y: up ? -8 : 8 }),
    animate: { opacity: 1, filter: 'blur(0px)', y: 0 },
    exit: up => ({ opacity: 0, filter: 'blur(8px)', y: up ? 8 : -8 }),
    transition: { duration: 0.18, ease: 'easeOut' },
  },
};

function CharSlot({ char, effect, countingUp }) {
  const variant = effects[effect];
  if (!/\d/.test(char)) return <span className="count-up-separator">{char}</span>;
  if (!variant) return <span>{char}</span>;

  return <span className={cn('count-up-char', `count-up-${effect}`)}>
    <AnimatePresence mode="popLayout" initial={false} custom={countingUp}>
      <m.span key={char} custom={countingUp} initial="initial" animate="animate" exit="exit" variants={variant} transition={variant.transition}>
        {char}
      </m.span>
    </AnimatePresence>
  </span>;
}

export function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  slowDownAt,
  fastDuration = 1,
  digitEffect = 'none',
  className,
  startWhen = true,
  separator = '',
  locale = 'en-US',
  onStart,
  onEnd,
}) {
  const [ref, inView] = useInView({ threshold: 0.5 });
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const visible = usePageVisible();
  const start = direction === 'down' ? to : from;
  const target = direction === 'down' ? from : to;
  const motionValue = useMotionValue(start);
  // Start the visible counter at zero on both server render and hydration.
  // The static total remains available to screen readers and without JavaScript.
  const [value, setValue] = useState(start);
  const [started, setStarted] = useState(false);
  const callbacks = useRef({ onStart, onEnd });
  useEffect(() => { callbacks.current = { onStart, onEnd }; }, [onStart, onEnd]);

  const decimals = Math.max(...[from, to].map(number => String(number).split('.')[1]?.length || 0));
  const format = useCallback(number => {
    const precision = 10 ** decimals;
    // Do not round up to the final digit before the animation actually finishes.
    const displayed = number === target ? target : (target >= start
      ? Math.floor(number * precision)
      : Math.ceil(number * precision)) / precision;
    const formatted = new Intl.NumberFormat(locale, {
      useGrouping: Boolean(separator),
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(displayed);
    return separator ? formatted.replace(/,/g, separator) : formatted;
  }, [decimals, separator, locale, start, target]);

  useEffect(() => motionValue.on('change', setValue), [motionValue]);

  useEffect(() => {
    if (!inView || !startWhen || reduced || !visible) return;
    motionValue.jump(start);
    setValue(start);
    setStarted(true);
    let animation;
    const startTimer = setTimeout(() => {
      callbacks.current.onStart?.();
      const seconds = Math.max(0, duration);
      const slowdown = slowDownAt ?? start + (target - start) * 5 / 6;
      const phased = fastDuration > 0 && fastDuration < seconds
        && slowdown > Math.min(start, target) && slowdown < Math.max(start, target);
      const finishPower = 6;
      // Match the speed at the phase boundary so the slowdown has no sudden jump.
      const joinSlope = phased ? Math.min(2,
        finishPower * (target - slowdown) * fastDuration
        / ((slowdown - start) * (seconds - fastDuration))) : 1;
      animation = animateValue(motionValue, phased ? [start, slowdown, target] : target, {
        type: 'tween',
        duration: seconds,
        // Reach the milestone quickly, then spend the remaining time slowing down.
        ...(phased ? {
          times: [0, fastDuration / seconds, 1],
          ease: [
            progress => progress + (1 - joinSlope) * progress * (1 - progress),
            progress => 1 - (1 - progress) ** finishPower,
          ],
        } : {
          ease: progress => 1 - (1 - progress) ** 2,
        }),
        onComplete: () => {
          setValue(target);
          callbacks.current.onEnd?.();
        },
      });
    }, Math.max(0, delay) * 1000);
    return () => {
      clearTimeout(startTimer);
      animation?.stop();
    };
  }, [inView, startWhen, reduced, visible, start, target, delay, duration, slowDownAt, fastDuration, motionValue]);

  const animate = started && !reduced;
  const formatted = format(reduced ? target : value);
  let content = separator ? formatted.split(separator).map((group, index) => <Fragment key={index}>
    {index > 0 && <span className="count-up-separator">{separator}</span>}{group}
  </Fragment>) : formatted;

  if (animate && digitEffect === 'slide') {
    const largestValue = Math.max(Math.abs(start), Math.abs(target));
    const structure = format(largestValue);
    let place = (structure.match(/\d/g)?.length || 0) - decimals;
    content = <>{target < 0 && <span>−</span>}{Array.from(structure, (char, index) => /\d/.test(char)
      ? <OdometerDigit key={index} motionValue={motionValue} place={10 ** --place} />
      : <span key={index} className="count-up-separator">{char}</span>)}</>;
  } else if (animate && digitEffect !== 'none') {
    content = Array.from(formatted, (char, index) => <CharSlot key={index} char={char} effect={digitEffect} countingUp={direction === 'up'} />);
  }

  return <span ref={ref} className={cn('count-up', className)}>
    <span className="sr-only">{format(target)}</span>
    <span className="count-up-visual" aria-hidden="true">{content}</span>
  </span>;
}

export default CountUp;
