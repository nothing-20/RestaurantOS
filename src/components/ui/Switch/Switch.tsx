import React from 'react';
import { cn } from '../../../utils/cn';

export interface ISwitchProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const Switch: React.FC<ISwitchProps> = ({
  checked,
  onChange,
  label,
  className,
  disabled = false
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className={cn("flex items-center space-x-3 text-left", className)}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "relative inline-flex h-5.5 w-10.5 items-center rounded-full transition-all duration-350 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-40 disabled:cursor-not-allowed",
          checked ? "bg-primary" : "bg-slate-800"
        )}
      >
        <span
          className={cn(
            "inline-block h-4.5 w-4.5 transform rounded-full bg-white transition-all duration-350",
            checked ? "translate-x-5" : "translate-x-0.75"
          )}
        />
      </button>
      {label ? (
        <span className="text-xs text-slate-400 select-none font-medium">{label}</span>
      ) : null}
    </div>
  );
};
export default Switch;
