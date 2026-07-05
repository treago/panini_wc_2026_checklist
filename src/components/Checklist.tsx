import { useMemo, useState, useDeferredValue, useCallback } from "react";
import type { Card, CardValue, ChecklistGroup, CardsData } from "../types";
import type { Collection } from "../hooks/useCollection";
import { CardItem } from "./CardItem";
import { GroupHeader } from "./GroupHeader";
import { ChecklistHeader } from "./ChecklistHeader";

type Props = {
  title: string;
  items: CardsData;
  section?: ChecklistGroup;
  collection: Collection;
  updateCard: (id: number, value: CardValue) => void;
  readOnly?: boolean;
};

type Group = { label: string; cards: Card[] };

export default function Checklist({
  title,
  items,
  section = "all",
  collection,
  updateCard,
  readOnly = false,
}: Props) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [currentSection, setCurrentSectionInternal] = useState(section);

  const setCurrentSection = useCallback((newSection: ChecklistGroup) => {
    setCurrentSectionInternal(newSection);
    // Reset search on tab change
    setQuery("");
  }, []);

  const [editMode, setEditMode] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const allCards = useMemo<Card[]>(() => {
    const map = new Map<number, Card>();
    Object.values(items.data || {})
      .flat()
      .forEach((card) => map.set(card.id, card));
    return Array.from(map.values()).sort((a, b) => a.id - b.id);
  }, [items]);

  const groupedData = useMemo<Group[]>(() => {
    const groups: Group[] = [];

    for (const [key, cards] of Object.entries(items.data || {})) {
      groups.push({ label: key, cards: [...cards] });
    }

    return groups;
  }, [items]);

  const formattedQuery = deferredQuery.toLowerCase().trim();

  const targetIds = useMemo<number[]>(() => {
    const match = formattedQuery.match(/^([\d\s,]+)$/);
    if (!match) return [];
    return match[1]
      .split(",")
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n));
  }, [formattedQuery]);

  const isIdArraySearch = targetIds.length > 0;

  const cardMatchesSearch = useCallback(
    (card: Card) => {
      if (isIdArraySearch) return targetIds.includes(card.id);
      if (!formattedQuery) return true;
      return (
        String(card.id).includes(formattedQuery) ||
        card.name.toLowerCase().includes(formattedQuery) ||
        card.position.toLowerCase().includes(formattedQuery)
      );
    },
    [isIdArraySearch, targetIds, formattedQuery],
  );

  const filteredFlatCards = useMemo(
    () => allCards.filter(cardMatchesSearch),
    [allCards, cardMatchesSearch],
  );

  const filteredGroups = useMemo<Group[]>(() => {
    if (!formattedQuery && !isIdArraySearch) return groupedData;
    return groupedData
      .map((group) => ({
        ...group,
        cards: group.cards.filter(cardMatchesSearch),
      }))
      .filter((group) => group.cards.length > 0);
  }, [groupedData, cardMatchesSearch, formattedQuery, isIdArraySearch]);

  const spareCards = useMemo(
    () =>
      filteredFlatCards.filter((card) => {
        const v = collection[String(card.id)];
        return v?.quantity && v.quantity > 1;
      }),
    [filteredFlatCards, collection],
  );

  const unownedCards = useMemo(() => {
    const seen = new Set<number>();
    return filteredFlatCards.filter((card) => {
      if (seen.has(card.id)) return false;
      seen.add(card.id);
      return !collection[String(card.id)]?.owned;
    });
  }, [filteredFlatCards, collection]);

  const cardsToShow = useMemo(() => {
    if (currentSection === "unowned") return unownedCards;
    if (currentSection === "spare") return spareCards;
    return filteredFlatCards;
  }, [currentSection, unownedCards, spareCards, filteredFlatCards]);

  const displayedGroups = useMemo(
    () => (currentSection === "grouped" ? filteredGroups : []),
    [currentSection, filteredGroups],
  );

  const currentCards = useMemo<Card[]>(() => {
    const cards =
      currentSection === "all" ||
      currentSection === "unowned" ||
      currentSection === "spare"
        ? cardsToShow
        : displayedGroups.flatMap((g) => g.cards);
    const uniqueMap = new Map<number, Card>();
    for (const card of cards) uniqueMap.set(card.id, card);
    return Array.from(uniqueMap.values());
  }, [currentSection, cardsToShow, displayedGroups]);

  const totalCards = allCards.length;

  const ownedCountGlobal = useMemo(
    () => allCards.filter((c) => collection[String(c.id)]?.owned).length,
    [allCards, collection],
  );

  const progressPercentage =
    totalCards > 0 ? Math.round((ownedCountGlobal / totalCards) * 100) : 0;

  const extractAndCopyIds = useCallback(async () => {
    if (currentCards.length === 0) return;
    const idsString = currentCards.map((c) => c.id).join(", ");
    try {
      await navigator.clipboard.writeText(idsString);
      setShowCopied(true);
      // Auto-hide after 3 seconds
      setTimeout(() => setShowCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy to clipboard", err);
    }
  }, [currentCards]);

  // Shared renderer so both flat and grouped views use identical CardItem props
  const renderCard = useCallback(
    (card: Card) => (
      <CardItem
        key={card.id}
        card={card}
        value={collection[String(card.id)] ?? { owned: false, quantity: 1 }}
        onChange={(v) => updateCard(card.id, v)}
        readOnly={readOnly}
        editMode={editMode}
      />
    ),
    [collection, updateCard, readOnly, editMode],
  );

  return (
    <div className="space-y-10">
      <ChecklistHeader
        items={items}
        title={title}
        query={query}
        setQuery={setQuery}
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
      />

      {/* ── STATS + CONTROLS PANEL ──────────────────────────────────────── */}
      <div className="top-4 z-50 flex max-h-[45vh] flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {/* Row: counts + action buttons */}
        <div className="flex shrink-0 flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5 text-sm">
            <div>
              <span className="text-gray-500">Owned:</span>{" "}
              <span className="font-semibold text-green-600">
                {ownedCountGlobal}
              </span>
              <span className="text-gray-400"> / {totalCards}</span>
            </div>
            <div>
              <span className="text-gray-500">Missing:</span>{" "}
              <span className="font-semibold text-red-500">
                {totalCards - ownedCountGlobal}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Edit mode toggle — hidden for read-only shared views */}
            {!readOnly && (
              <button
                onClick={() => setEditMode((v) => !v)}
                className={[
                  "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  editMode
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
                ].join(" ")}
              >
                {editMode ? (
                  <>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />
                    </svg>
                    Editing
                  </>
                ) : (
                  <>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Locked
                  </>
                )}
              </button>
            )}

            <button
              onClick={extractAndCopyIds}
              disabled={currentCards.length === 0}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy IDs
            </button>
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
            📋 IDs copied to clipboard!
          </div>
        )}
      </div>

      {/* ── CARD GRID ───────────────────────────────────────────────────── */}
      {currentSection === "all" ||
      currentSection === "unowned" ||
      currentSection === "spare" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {cardsToShow.map(renderCard)}
        </div>
      ) : (
        displayedGroups.map(({ label, cards }) => (
          <div key={label} className="scroll-mt-20">
            <GroupHeader label={label} cards={cards} collection={collection} />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {cards.map(renderCard)}
            </div>
          </div>
        ))
      )}

      {currentCards.length === 0 && (
        <div className="py-20 text-center text-xl text-gray-400">
          No cards found matching your search.
        </div>
      )}
    </div>
  );
}
