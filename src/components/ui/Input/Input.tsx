import React from 'react';
import { cn } from '../../../utils/cn';

export interface IInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, IInputProps>(
  ({ label, error, className, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col space-y-1.5 text-left">
        {label ? (
          <span className="text-xs font-semibold text-slate-400 select-none">{label}</span>
        ) : null}
        <input
          ref={ref}
          type={type}
          className={cn(
            "w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 text-textPearl rounded-xl text-sm placeholder-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
            error ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500" : "",
            className
          )}
          {...props}
        />
        {error ? (
          <span className="text-[11px] font-semibold text-red-500 pl-1">{error}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
