import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../../utils/cn';
import Button from '../Button/Button';

export interface IDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
}

export const Dialog: React.FC<IDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone and will modify the system settings.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDangerous = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Dialog box frame */}
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 backdrop-blur-md shadow-2xl rounded-2xl relative z-10 flex flex-col p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 border",
          isDangerous 
            ? "bg-red-500/10 border-red-500/20 text-red-500" 
            : "bg-amber-500/10 border-amber-500/20 text-amber-500"
        )}>
          <AlertTriangle className="w-5 h-5" />
        </div>

        <h3 className="font-display font-bold text-base text-textPearl mb-1">
          {title}
        </h3>
        <p className="text-xs text-mutedAsh mb-6">
          {message}
        </p>

        <div className="flex items-center space-x-3">
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex-1" 
            onClick={onClose}
          >
            {cancelLabel}
          </Button>
          <Button 
            variant={isDangerous ? 'danger' : 'primary'} 
            size="sm" 
            className="flex-1" 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
export default Dialog;
