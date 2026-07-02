import React from 'react';
import { cn } from '../../../utils/cn';

export interface ILoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<ILoadingSpinnerProps> = ({
  size = 'md',
  className,
  label
}) => {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-3.5 p-4", className)}>
      <div className={cn(
        "rounded-full border-slate-800 border-t-primary animate-spin",
        sizes[size]
      )} />
      {label ? (
        <span className="text-xs font-semibold text-slate-500 animate-pulse">{label}</span>
      ) : null}
    </div>
  );
};
export default LoadingSpinner;
