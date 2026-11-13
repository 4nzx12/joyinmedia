import { forwardRef } from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils.js';

// CSS :active handles pointer AND keyboard presses without replacing caller handlers.
export const MetalButton = forwardRef(function MetalButton({ asChild = false, variant = 'default', className, children, type = 'button', ...props }, ref) {
  const Component = asChild ? Slot : 'button';
  return <Component ref={ref} {...(!asChild ? { type } : {})} className={cn('metal-button', `metal-button-${variant}`, className)} {...props}>
    <span className="metal-button-shine" aria-hidden="true" />
    <Slottable>{children}</Slottable>
  </Component>;
});
