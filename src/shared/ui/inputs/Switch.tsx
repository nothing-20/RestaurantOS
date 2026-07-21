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
          "relative inline-flex items-center rounded-full transition-all duration-350 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-primary disabled:opacity-40 disabled:cursor-not-allowed",
          checked ? "bg-primary" : "bg-slate-700"
        )}
        style={{ width: '40px', height: '20px' }}
      >
        <span
          className={cn(
            "inline-block rounded-full bg-white transition-all duration-350"
          )}
          style={{
            width: '14px',
            height: '14px',
            transform: checked ? 'translateX(22px)' : 'translateX(4px)'
          }}
        />
      </button>
      {label ? (
        <span className="text-xs text-slate-350 select-none font-semibold leading-none">{label}</span>
      ) : null}
    </div>
  );
};
export default Switch;
