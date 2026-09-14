import React from 'react';
import { CheckSquare, Square, X } from 'lucide-react';

// ─── Bulk Action Button ───────────────────────────────────────────────────────

const BulkBtn: React.FC<{
  label: string;
  className: string;
  onClick: () => void;
  disabled?: boolean;
}> = ({ label, className, onClick, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
  >
    <span>{label}</span>
  </button>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface IBulkActionsToolbarProps {
  selectedCount: number;
  totalVisible: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  /** Called with the target status when an action button is clicked */
  onRequestAction: (nextStatus: string, label: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const BulkActionsToolbar: React.FC<IBulkActionsToolbarProps> = ({
  selectedCount,
  totalVisible,
  allSelected,
  onSelectAll,
  onClearSelection,
  onRequestAction,
}) => {
  if (selectedCount === 0) return null;

  return (
    // Fixed floating bar pinned to bottom of viewport
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-max max-w-[calc(100vw-2rem)] font-sans select-none">
      <div className="flex items-center space-x-3 bg-[#13241F] border border-[#1E3B33] shadow-2xl rounded-xl px-4 py-2.5 text-white">

        {/* Selection count + select-all toggle */}
        <button
          onClick={allSelected ? onClearSelection : onSelectAll}
          className="flex items-center space-x-2 text-xs font-bold text-white hover:text-[#D79A24] transition-colors pr-3 border-r border-[#1E3B33]"
        >
          {allSelected
            ? <CheckSquare className="w-4 h-4 text-[#287A55]" />
            : <Square className="w-4 h-4 text-[#8D9B95]" />
          }
          <span>
            {selectedCount} of {totalVisible} selected
          </span>
        </button>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <BulkBtn
            label="Accept"
            className="bg-[#1A312B] hover:bg-[#23423A] text-white border border-[#2B5248]"
            onClick={() => onRequestAction('ACCEPTED', 'Accept')}
          />
          <BulkBtn
            label="Start Cooking"
            className="bg-[#C84A38] hover:bg-[#B23F2F] text-white shadow-sm"
            onClick={() => onRequestAction('PREPARING', 'Start Cooking')}
          />
          <BulkBtn
            label="Mark Ready"
            className="bg-[#287A55] hover:bg-[#206345] text-white shadow-sm"
            onClick={() => onRequestAction('READY', 'Mark Ready')}
          />
          <BulkBtn
            label="Archive"
            className="bg-[#1A312B] hover:bg-[#23423A] text-[#8D9B95] hover:text-white border border-[#2B5248]"
            onClick={() => onRequestAction('ARCHIVED', 'Archive')}
          />
        </div>

        {/* Cancel */}
        <button
          onClick={onClearSelection}
          className="ml-1 p-1 rounded-lg text-[#8D9B95] hover:text-white hover:bg-[#1A312B] transition-all"
          title="Cancel selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;
