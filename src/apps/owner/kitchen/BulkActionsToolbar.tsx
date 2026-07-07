import React from 'react';
import { CheckSquare, Square, X } from 'lucide-react';

// ─── Bulk Action Button ───────────────────────────────────────────────────────

const BulkBtn: React.FC<{
  label: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}> = ({ label, color, onClick, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider border transition-all flex items-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${color}`}
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

const BulkActionsToolbar: React.FC<IBulkActionsToolbarProps> = ({
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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-max max-w-[calc(100vw-2rem)]">
      <div className="flex items-center space-x-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl shadow-black/50 rounded-2xl px-4 py-3">

        {/* Selection count + select-all toggle */}
        <button
          onClick={allSelected ? onClearSelection : onSelectAll}
          className="flex items-center space-x-1.5 text-xs font-extrabold text-textPearl hover:text-primary transition-colors pr-3 border-r border-slate-700"
        >
          {allSelected
            ? <CheckSquare className="w-4 h-4 text-primary" />
            : <Square className="w-4 h-4 text-slate-400" />
          }
          <span>
            {selectedCount} of {totalVisible} selected
          </span>
        </button>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <BulkBtn
            label="Accept"
            color="bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
            onClick={() => onRequestAction('ACCEPTED', 'Accept')}
          />
          <BulkBtn
            label="Preparing"
            color="bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20"
            onClick={() => onRequestAction('PREPARING', 'Mark Preparing')}
          />
          <BulkBtn
            label="Mark Ready"
            color="bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
            onClick={() => onRequestAction('READY', 'Mark Ready')}
          />
          <BulkBtn
            label="Archive"
            color="bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
            onClick={() => onRequestAction('ARCHIVED', 'Archive')}
          />
        </div>

        {/* Cancel */}
        <button
          onClick={onClearSelection}
          className="ml-1 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
          title="Cancel selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;
