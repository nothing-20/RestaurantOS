import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';
import Button from '../Button/Button';

export interface IErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<IErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected system error occurred while synchronizing database channels.',
  onRetry,
  className
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center border border-red-500/10 rounded-2xl bg-red-500/5 backdrop-blur-sm", className)}>
      <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center justify-center mb-4">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="font-display font-bold text-sm text-textPearl">{title}</h3>
      <p className="text-xs text-mutedAsh mt-1 max-w-xs">{message}</p>
      
      {onRetry ? (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry} 
          className="mt-5 border-slate-800 hover:border-red-500/40 text-slate-300 hover:text-red-500"
        >
          Try Reloading
        </Button>
      ) : null}
    </div>
  );
};
export default ErrorState;
