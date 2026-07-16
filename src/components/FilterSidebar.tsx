import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CHECKLIST_GROUPS,
  GROUP_BY_MODES,
  type ChecklistGroup,
  type GroupByMode,
} from "../types";
import type { CountryOption } from "../utils/country";
import { Select } from "./ui/Select";
import { Button } from "./ui/Button";
import { IconClose } from "./icons/Icons";
import { cn } from "../utils/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  section: ChecklistGroup;
  setSection: (v: ChecklistGroup) => void;
  groupBy: GroupByMode;
  setGroupBy: (v: GroupByMode) => void;
  position: string;
  setPosition: (v: string) => void;
  positionOptions: string[];
  country: string;
  setCountry: (v: string) => void;
  countryOptions: CountryOption[];
  hasActiveFilters: boolean;
  onReset: () => void;
};

export function FilterSidebar({
  open,
  onClose,
  section,
  setSection,
  groupBy,
  setGroupBy,
  position,
  setPosition,
  positionOptions,
  country,
  setCountry,
  countryOptions,
  hasActiveFilters,
  onReset,
}: Props) {
  // Escape-to-close + lock body scroll while the sidebar is open.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className={cn(
          "fixed top-0 right-0 z-50 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 dark:bg-gray-900",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h3 className="text-sm font-bold tracking-widest text-gray-800 uppercase dark:text-gray-100">
            Filters
          </h3>
          <button
            onClick={onClose}
            aria-label="Close filters"
            className="cursor-pointer rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <IconClose />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <FilterGroup label="Show">
            <div className="flex flex-col gap-1.5">
              {CHECKLIST_GROUPS.map((group) => (
                <button
                  key={group}
                  onClick={() => setSection(group)}
                  className={cn(
                    "cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-semibold capitalize transition-colors",
                    section === group
                      ? "bg-wc-red text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
                  )}
                >
                  {group}
                </button>
              ))}
            </div>
          </FilterGroup>

          {/* Only meaningful once "grouped" is selected above */}
          {section === "grouped" && (
            <FilterGroup label="Group by">
              <div className="flex gap-1.5">
                {GROUP_BY_MODES.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setGroupBy(mode)}
                    className={cn(
                      "flex-1 cursor-pointer rounded-lg px-3 py-2 text-xs font-bold tracking-widest uppercase transition-colors",
                      groupBy === mode
                        ? "bg-wc-red text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </FilterGroup>
          )}

          <FilterGroup label="Position">
            <Select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              aria-label="Filter by position"
              options={[
                { value: "all", label: "All positions" },
                ...positionOptions.map((p) => ({ value: p, label: p })),
              ]}
            />
          </FilterGroup>

          <FilterGroup label="Country">
            <Select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              aria-label="Filter by country"
              options={[
                { value: "all", label: "All countries" },
                ...countryOptions.map((c) => ({
                  value: c.code,
                  label: c.name,
                })),
              ]}
            />
          </FilterGroup>
        </div>

        <div className="shrink-0 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="w-full justify-center"
          >
            Clear all filters
          </Button>
        </div>
      </div>
    </>,
    document.body,
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
        {label}
      </div>
      {children}
    </div>
  );
}
