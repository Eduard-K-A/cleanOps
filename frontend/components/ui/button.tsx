'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variant === 'default' && 'bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-500',
          variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
          variant === 'outline' && 'border border-slate-300 bg-white hover:bg-slate-50 focus-visible:ring-sky-500',
          variant === 'ghost' && 'hover:bg-slate-100 focus-visible:ring-sky-500',
          variant === 'link' && 'text-sky-600 underline-offset-4 hover:underline',
          size === 'default' && 'h-10 px-4 py-2',
          size === 'sm' && 'h-8 rounded-md px-3 text-sm',
          size === 'lg' && 'h-12 rounded-xl px-6 text-base',
          size === 'icon' && 'h-10 w-10',
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
