import { useState } from "react";
import type { ChecklistGroup, GroupByMode } from "../types";
import type { CountryOption } from "../utils/country";
import { IconSearch, IconClose, IconFilter } from "./icons/Icons";
import { FilterSidebar } from "./FilterSidebar";
import { cn } from "../utils/cn";

type Props = {
  query: string;
  setQuery: (v: string) => void;
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
  onResetFilters: () => void;
};

// Human-readable chip shown next to the filter button so the active
// "Show" section is visible without having to open the sidebar.
function sectionChipLabel(section: ChecklistGroup): string | null {
  return section === "all" ? null : section;
}

export function FilterBar({
  query,
  setQuery,
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
  onResetFilters,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chipLabel = sectionChipLabel(section);

  return (
    <div className="flex items-center gap-2">
      {/* Search */}
      <div className="relative flex-1">
        <IconSearch className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-500" />

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by number, name, country…"
          className="focus:border-wc-gold/50 focus:ring-wc-gold/50 w-full rounded-xl border border-white/10 bg-black/40 py-3 pr-10 pl-11 text-sm text-white transition placeholder:text-gray-500 focus:ring-1 focus:outline-none"
        />

        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded-full p-0.5 text-gray-500 transition hover:text-white"
          >
            <IconClose />
          </button>
        )}
      </div>

      {/* Active-section chip — quick context, also opens the sidebar */}
      {chipLabel && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="bg-wc-red/90 hover:bg-wc-red hidden shrink-0 cursor-pointer rounded-xl px-3 py-3 text-xs font-bold tracking-widest text-white capitalize transition sm:block"
        >
          {chipLabel}
        </button>
      )}

      {/* Filter trigger */}
      <button
        onClick={() => setSidebarOpen(true)}
        aria-label="Open filters"
        className={cn(
          "hover:border-wc-gold/50 relative flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-black/40 p-3 text-gray-300 transition hover:text-white",
        )}
      >
        <IconFilter />
        {hasActiveFilters && (
          <span className="bg-wc-gold absolute top-1.5 right-1.5 h-2 w-2 rounded-full" />
        )}
      </button>

      <FilterSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        section={section}
        setSection={setSection}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        position={position}
        setPosition={setPosition}
        positionOptions={positionOptions}
        country={country}
        setCountry={setCountry}
        countryOptions={countryOptions}
        hasActiveFilters={hasActiveFilters}
        onReset={onResetFilters}
      />
    </div>
  );
}
