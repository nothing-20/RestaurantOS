import React from 'react';
import { Clipboard } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface IEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<any>;
  className?: string;
}

export const EmptyState: React.FC<IEmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no active documents or records registered matching this filter.',
  icon: IconComponent = Clipboard,
  className
}) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-800/80 rounded-2xl bg-slate-900/10 backdrop-blur-sm", className)}>
      <div className="w-12 h-12 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 mb-4">
        <IconComponent className="w-5 h-5" />
      </div>
      <h3 className="font-display font-bold text-sm text-textPearl">{title}</h3>
      <p className="text-xs text-mutedAsh mt-1 max-w-xs">{description}</p>
    </div>
  );
};
export default EmptyState;
