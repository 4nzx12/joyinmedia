// Adapted from the supplied component collection for this project's plain CSS.
import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

export const buttonVariants = cva('ui-button', {
  variants: {
    variant: { default: 'ui-button-primary', outline: 'ui-button-outline', ghost: 'ui-button-ghost', secondary: 'ui-button-secondary' },
    size: { default: '', sm: 'ui-button-sm', lg: 'ui-button-lg', icon: 'ui-button-icon' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

export const Button = forwardRef(function Button({ asChild = false, variant, size, className, type = 'button', ...props }, ref) {
  const Component = asChild ? Slot : 'button';
  return <Component ref={ref} {...(!asChild ? { type } : {})} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
