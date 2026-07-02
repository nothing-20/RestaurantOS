import React from 'react';
import { cn } from '../../../utils/cn';

export interface ITextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, ITextAreaProps>(
  ({ label, error, className, rows = 4, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col space-y-1.5 text-left">
        {label ? (
          <span className="text-xs font-semibold text-slate-400 select-none">{label}</span>
        ) : null}
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            "w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 text-textPearl rounded-xl text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none",
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

TextArea.displayName = 'TextArea';
export default TextArea;
