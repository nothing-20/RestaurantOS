import React from 'react';
import { cn } from '../../../utils/cn';

export interface ICheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, ICheckboxProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1 text-left">
        <div className="flex items-center space-x-2.5 cursor-pointer">
          <input
            ref={ref}
            type="checkbox"
            className={cn(
              "w-4 h-4 accent-primary rounded bg-slate-900 border-slate-800 focus:ring-0 cursor-pointer transition-all",
              className
            )}
            {...props}
          />
          {label ? (
            <span className="text-xs text-slate-400 select-none">{label}</span>
          ) : null}
        </div>
        {error ? (
          <span className="text-[10px] font-semibold text-red-500 pl-6">{error}</span>
        ) : null}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
export default Checkbox;
