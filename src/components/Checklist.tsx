import { useCallback, useState } from "react";
import type { CardValue, CardsData, ChecklistGroup } from "../types";
import type { Collection } from "../hooks/useCollection";
import { useCardFilters } from "../hooks/useCardFilters";
import { ChecklistHeader } from "./ChecklistHeader";
import { StatsPanel } from "./StatsPanel";
import { CardGrid } from "./CardGrid";

type Props = {
  title: string;
  numbered: boolean;
  items: CardsData;
  section?: ChecklistGroup;
  collection: Collection;
  updateCard: (id: string, value: CardValue) => void;
  readOnly?: boolean;
};

export default function Checklist({
  title,
  items,
  numbered,
  section = "all",
  collection,
  updateCard,
  readOnly = false,
}: Props) {
  const filters = useCardFilters(items, collection, section);
  const [editMode, setEditMode] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const progressPercentage =
    filters.totalCards > 0
      ? Math.round((filters.ownedCountGlobal / filters.totalCards) * 100)
      : 0;

  const extractAndCopy = useCallback(
    async (field: "number" | "name") => {
      if (filters.currentCards.length === 0) return;
      const text = filters.currentCards.map((c) => c[field]).join(", ");
      try {
        await navigator.clipboard.writeText(text);
        setShowCopied(true);
        // Auto-hide after 3 seconds
        setTimeout(() => setShowCopied(false), 3000);
      } catch (err) {
        console.error("Failed to copy to clipboard", err);
      }
    },
    [filters.currentCards],
  );

  const isFlatView = filters.section !== "grouped";

  return (
    <div className="space-y-10">
      <ChecklistHeader
        items={items}
        title={title}
        query={filters.query}
        setQuery={filters.setQuery}
        currentSection={filters.section}
        setCurrentSection={filters.setSection}
        position={filters.position}
        setPosition={filters.setPosition}
        positionOptions={filters.positionOptions}
        country={filters.country}
        setCountry={filters.setCountry}
        countryOptions={filters.countryOptions}
        groupBy={filters.groupBy}
        setGroupBy={filters.setGroupBy}
        hasActiveFilters={filters.hasActiveFilters}
        onResetFilters={filters.resetFilters}
      />

      <StatsPanel
        ownedCount={filters.ownedCountGlobal}
        totalCards={filters.totalCards}
        progressPercentage={progressPercentage}
        numbered={numbered}
        editMode={editMode}
        onToggleEditMode={() => setEditMode((v) => !v)}
        readOnly={readOnly}
        onCopyIds={() => extractAndCopy("number")}
        onCopyNames={() => extractAndCopy("name")}
        canCopy={filters.currentCards.length > 0}
        showCopied={showCopied}
      />

      <CardGrid
        flat={isFlatView}
        cards={filters.cardsToShow}
        groups={filters.displayedGroups}
        collection={collection}
        updateCard={updateCard}
        readOnly={readOnly}
        editMode={editMode}
      />

      {filters.currentCards.length === 0 && (
        <div className="py-20 text-center text-xl text-gray-400">
          No cards found matching your search.
        </div>
      )}
    </div>
  );
}
