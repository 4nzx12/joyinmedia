import { forwardRef, useId } from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

export const liquidbuttonVariants = cva('liquid-button', {
  variants: { variant: { default: '', light: 'liquid-button-light' }, size: { default: '', sm: 'liquid-button-sm' } },
  defaultVariants: { variant: 'default', size: 'default' },
});

export const LiquidButton = forwardRef(function LiquidButton({ asChild = false, className, variant, size, children, type = 'button', ...props }, ref) {
  const Component = asChild ? Slot : 'button';
  const filterId = `glass-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return <Component ref={ref} {...(!asChild ? { type } : {})} className={cn(liquidbuttonVariants({ variant, size }), className)} {...props}>
    <span className="liquid-button-refraction" aria-hidden="true" style={{ backdropFilter: `url(#${filterId}) blur(4px)` }} />
    <span className="liquid-button-sheen" aria-hidden="true" />
    <Slottable>{children}</Slottable>
    <svg className="glass-filter" aria-hidden="true" focusable="false"><defs><filter id={filterId} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="noise" />
      <feGaussianBlur in="noise" stdDeviation="2" result="blurredNoise" />
      <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="24" xChannelSelector="R" yChannelSelector="B" />
    </filter></defs></svg>
  </Component>;
});
