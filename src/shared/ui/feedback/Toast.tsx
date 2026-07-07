import React, { useEffect } from 'react';
import { create } from 'zustand';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '../../../utils/cn';

export type TToastType = 'success' | 'error' | 'info';

interface IToast {
  id: string;
  message: string;
  type: TToastType;
}

interface IToastStore {
  toasts: IToast[];
  addToast: (message: string, type: TToastType) => void;
  removeToast: (id: string) => void;
}

// Global lightweight state for notification triggers
export const useToastStore = create<IToastStore>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

export const Toast: React.FC<IToast & { onClose: () => void }> = ({
  message,
  type,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />,
    error: <AlertCircle className="w-4.5 h-4.5 text-red-500" />,
    info: <Info className="w-4.5 h-4.5 text-blue-500" />
  };

  const borders = {
    success: 'border-emerald-500/20 bg-emerald-500/5',
    error: 'border-red-500/20 bg-red-500/5',
    info: 'border-blue-500/20 bg-blue-500/5'
  };

  return (
    <div className={cn(
      "flex items-center space-x-3 px-4 py-3 rounded-xl border glass-panel shadow-2xl max-w-sm animate-in slide-in-from-bottom-4 duration-300",
      borders[type]
    )}>
      {icons[type]}
      <span className="text-xs font-medium text-slate-200 flex-1 select-none">{message}</span>
      <button 
        onClick={onClose}
        className="p-1 text-slate-500 hover:text-textPearl hover:bg-slate-800 rounded-lg transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 pointer-events-auto">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};
export default ToastContainer;
