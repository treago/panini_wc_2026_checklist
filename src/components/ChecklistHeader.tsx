import type { CardsData, ChecklistGroup, GroupByMode } from "../types";
import type { CountryOption } from "../utils/country";
import { FilterBar } from "./FilterBar";

type Props = {
  items: CardsData;
  title: string;
  query: string;
  setQuery: (v: string) => void;
  currentSection: ChecklistGroup;
  setCurrentSection: (value: ChecklistGroup) => void;
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

export function ChecklistHeader({
  items,
  title,
  query,
  setQuery,
  currentSection,
  setCurrentSection,
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
  return (
    <div className="space-y-5">
      {/* Eyebrow + title */}
      <div>
        <p className="text-wc-gold/80 mb-1.5 text-xs font-bold tracking-[0.2em] uppercase">
          {items.meta.publisher} · {items.meta.total_cards} cards
        </p>
        <h2 className="text-4xl font-black tracking-tighter text-white">
          {title}
        </h2>
      </div>

      {/* Gold rule */}
      <div className="from-wc-gold/50 via-wc-gold/10 h-px bg-linear-to-r to-transparent" />

      {/* Search + filter trigger (section/position/country/groupBy live in the sidebar) */}
      <FilterBar
        query={query}
        setQuery={setQuery}
        section={currentSection}
        setSection={setCurrentSection}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        position={position}
        setPosition={setPosition}
        positionOptions={positionOptions}
        country={country}
        setCountry={setCountry}
        countryOptions={countryOptions}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={onResetFilters}
      />
    </div>
  );
}
