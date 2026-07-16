import { Panel } from "./ui/Panel";
import { Button } from "./ui/Button";
import { IconEdit, IconLock, IconCopy } from "./icons/Icons";

type Props = {
  ownedCount: number;
  totalCards: number;
  progressPercentage: number;
  numbered: boolean;
  editMode: boolean;
  onToggleEditMode: () => void;
  readOnly: boolean;
  onCopyIds: () => void;
  onCopyNames: () => void;
  canCopy: boolean;
  showCopied: boolean;
};

export function StatsPanel({
  ownedCount,
  totalCards,
  progressPercentage,
  numbered,
  editMode,
  onToggleEditMode,
  readOnly,
  onCopyIds,
  onCopyNames,
  canCopy,
  showCopied,
}: Props) {
  return (
    <Panel className="z-50 flex flex-col">
      {/* Row: counts + action buttons */}
      <div className="flex shrink-0 flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-5 text-sm">
          <div>
            <span className="text-gray-500">Owned:</span>{" "}
            <span className="font-semibold text-green-600">{ownedCount}</span>
            <span className="text-gray-400"> / {totalCards}</span>
          </div>
          <div>
            <span className="text-gray-500">Missing:</span>{" "}
            <span className="font-semibold text-red-500">
              {totalCards - ownedCount}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Edit mode toggle — hidden for read-only shared views */}
          {!readOnly && (
            <Button
              variant={editMode ? "toggleOn" : "toggleOff"}
              icon={editMode ? <IconEdit /> : <IconLock />}
              onClick={onToggleEditMode}
            >
              {editMode ? "Editing" : "Locked"}
            </Button>
          )}

          {numbered && (
            <Button
              variant="primary"
              icon={<IconCopy />}
              onClick={onCopyIds}
              disabled={!canCopy}
            >
              Copy IDs
            </Button>
          )}

          <Button
            variant="primary"
            icon={<IconCopy />}
            onClick={onCopyNames}
            disabled={!canCopy}
          >
            Copy names
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 shrink-0">
        <div className="mb-1 flex justify-between text-xs text-gray-500">
          <span>Collection Progress</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {progressPercentage}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-2 rounded-full bg-linear-to-r from-green-500 to-emerald-600 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Edit mode hint banner */}
      {editMode && !readOnly && (
        <div className="mt-3 shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
          ✏️ Editing active — tap any card to mark it as owned
        </div>
      )}

      {/* Copied message */}
      {showCopied && (
        <div className="mt-3 shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          📋 Copied to clipboard!
        </div>
      )}
    </Panel>
  );
}
