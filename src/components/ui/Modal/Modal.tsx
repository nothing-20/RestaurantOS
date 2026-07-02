import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface IModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<IModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className
}) => {
  if (!isOpen) return null;

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
          "w-full max-w-lg bg-slate-900 border border-slate-800 backdrop-blur-md shadow-2xl rounded-2xl relative z-10 flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200",
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
