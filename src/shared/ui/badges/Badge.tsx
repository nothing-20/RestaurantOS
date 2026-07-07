import React from 'react';
import { cn } from '../../../utils/cn';

export interface IBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'muted';
  isLarge?: boolean;
}

export const Badge: React.FC<IBadgeProps> = ({
  children,
  variant = 'muted',
  isLarge = false,
  className,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full select-none';

  const variants = {
    primary: 'bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5',
    success: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm shadow-emerald-500/5',
    warning: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow-sm',
    danger: 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm',
    muted: 'bg-slate-800 text-slate-400 border border-slate-700/50'
  };

  const sizes = isLarge ? 'px-3.5 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={cn(baseStyles, variants[variant], sizes, className)}
      {...props}
    >
      {children}
    </span>
  );
};
export default Badge;
