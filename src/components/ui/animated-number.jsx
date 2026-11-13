import NumberFlow from '@number-flow/react';
import { useReducedMotion } from '../../hooks/useBrowserState.js';

export function AnimatedNumber({ value, suffix, ...props }) {
  const reduced = useReducedMotion();
  return <NumberFlow value={value} suffix={suffix} locales="en-IN" animated={!reduced} {...props} />;
}
export default AnimatedNumber;
