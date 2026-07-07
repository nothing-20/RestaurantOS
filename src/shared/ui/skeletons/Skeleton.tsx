import React from 'react';
import { cn } from '../../../utils/cn';

export interface ISkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<ISkeletonProps> = ({
  className,
  variant = 'rect'
}) => {
  return (
    <div
      className={cn(
        "bg-slate-800/60 animate-pulse",
        variant === 'circle' ? 'rounded-full' : '',
        variant === 'text' ? 'h-3.5 w-full rounded-md' : '',
        variant === 'rect' ? 'rounded-xl' : '',
        className
      )}
    />
  );
};
export default Skeleton;
