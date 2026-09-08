import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface IModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'max';
}

export const Modal: React.FC<IModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  size = 'lg'
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    max: 'max-w-[95vw]'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
      {/* Background Overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog Content */}
      <div 
        className={cn(
          "w-full bg-slate-900 border border-slate-800 backdrop-blur-md shadow-2xl rounded-2xl relative z-10 flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200",
          sizeClasses[size] || 'max-w-lg',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 mb-4">
          <h3 className="font-display font-bold text-base text-textPearl">
            {title || 'Dialog'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 text-mutedAsh hover:text-textPearl hover:bg-slate-800 rounded-lg transition-all"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 text-sm text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
};
export default Modal;
