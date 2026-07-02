import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface IPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<IPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-center space-x-2.5 select-none", className)}>
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 border border-slate-800 text-slate-400 hover:text-textPearl hover:border-slate-700 bg-slate-900/40 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Pages Info */}
      <span className="text-xs text-mutedAsh">
        Page <strong className="text-textPearl font-semibold">{currentPage}</strong> of{' '}
        <strong className="text-textPearl font-semibold">{totalPages}</strong>
      </span>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 border border-slate-800 text-slate-400 hover:text-textPearl hover:border-slate-700 bg-slate-900/40 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
export default Pagination;
