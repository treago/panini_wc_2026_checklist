import { useMemo, useState, useDeferredValue, useCallback } from "react";
import type { Card, CardValue, ChecklistGroup, FifaCardsData } from "../types";
import type { Collection } from "../hooks/useCollection";
import { CardItem } from "./CardItem";
import { GroupHeader } from "./GroupHeader";
import { ChecklistHeader } from "./ChecklistHeader";

type Props = {
  title: string;
  items: FifaCardsData;
  section?: ChecklistGroup;
  collection: Collection;
  updateCard: (id: number, value: CardValue) => void;
};

type Group = {
  label: string;
  code: string;
  cards: Card[];
};

export default function Checklist({
  title,
  items,
  section = "all",
  collection,
  updateCard,
}: Props) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const [currentSection, setCurrentSection] = useState(section);

  // State for extracted IDs
  const [extractedIds, setExtractedIds] = useState<string>("");
  const [showExtracted, setShowExtracted] = useState(true);

  const toCode = useCallback((key: string) => {
    const match = key.match(/\((.+?)\)/);
    return match ? match[1] : key.slice(0, 3).toUpperCase();
  }, []);

  // Flat list for ALL / UNOWNED / SPARE — used as source of truth for global stats
  const allCards = useMemo<Card[]>(() => {
    const map = new Map<number, Card>();

    [
      ...Object.values(items.special || {}),
      ...Object.values(items.countries || {}),
    ]
      .flat()
      .forEach((card) => {
        map.set(card.id, card);
      });

    return Array.from(map.values()).sort((a, b) => a.id - b.id);
  }, [items]);

  const groupedData = useMemo<Group[]>(() => {
    const groups: Group[] = [];

    for (const [key, cards] of Object.entries(items.special || {})) {
      groups.push({
        label: key,
        code: toCode(key),
        cards: [...cards],
      });
    }

    for (const [key, cards] of Object.entries(items.countries || {})) {
      groups.push({
        label: key,
        code: toCode(key),
        cards: [...cards],
      });
    }

    return groups;
  }, [items, toCode]);

  const formattedQuery = deferredQuery.toLowerCase().trim();

  // Parse ID array like "25, 65, 84" or "25,65,84"
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
      if (isIdArraySearch) {
        return targetIds.includes(card.id);
      }

      if (!formattedQuery) return true;

      return (
        String(card.id).includes(formattedQuery) ||
        card.name.toLowerCase().includes(formattedQuery) ||
        card.position.toLowerCase().includes(formattedQuery)
      );
    },
    [isIdArraySearch, targetIds, formattedQuery],
  );

  const filteredFlatCards = useMemo(() => {
    return allCards.filter(cardMatchesSearch);
  }, [allCards, cardMatchesSearch]);

  const filteredGroups = useMemo<Group[]>(() => {
    if (!formattedQuery && !isIdArraySearch) return groupedData;

    return groupedData
      .map((group) => ({
        ...group,
        cards: group.cards.filter(cardMatchesSearch),
      }))
      .filter((group) => group.cards.length > 0);
  }, [groupedData, cardMatchesSearch, formattedQuery, isIdArraySearch]);

  // Flat view specific
  const spareCards = useMemo(() => {
    return filteredFlatCards.filter((card) => {
      const value = collection[String(card.id)];
      return value?.quantity && value.quantity > 1;
    });
  }, [filteredFlatCards, collection]);

  const unownedCards = useMemo(() => {
    const seen = new Set<number>();
    return filteredFlatCards.filter((card) => {
      if (seen.has(card.id)) return false;
      seen.add(card.id);
      const value = collection[String(card.id)];
      return !value?.owned;
    });
  }, [filteredFlatCards, collection]);

  const cardsToShow = useMemo(() => {
    if (currentSection === "unowned") return unownedCards;
    if (currentSection === "spare") return spareCards;
    return filteredFlatCards;
  }, [currentSection, unownedCards, spareCards, filteredFlatCards]);

  const displayedGroups = useMemo(() => {
    if (currentSection === "grouped") {
      return filteredGroups;
    }
    return [];
  }, [currentSection, filteredGroups]);

  // Current displayed cards (for copy button) — deduplicated
  const currentCards = useMemo<Card[]>(() => {
    let cards: Card[];

    if (
      currentSection === "all" ||
      currentSection === "unowned" ||
      currentSection === "spare"
    ) {
      cards = cardsToShow;
    } else {
      cards = displayedGroups.flatMap((g) => g.cards);
    }

    const uniqueMap = new Map<number, Card>();
    for (const card of cards) {
      uniqueMap.set(card.id, card);
    }
    return Array.from(uniqueMap.values());
  }, [currentSection, cardsToShow, displayedGroups]);

  // === GLOBAL COLLECTION STATS (independent of search/tab) ===
  const totalCards = allCards.length;

  const ownedCountGlobal = useMemo(() => {
    return allCards.filter((card) => collection[String(card.id)]?.owned).length;
  }, [allCards, collection]);

  const progressPercentage =
    totalCards > 0 ? Math.round((ownedCountGlobal / totalCards) * 100) : 0;

  // Extract & Copy IDs
  const extractAndCopyIds = useCallback(async () => {
    if (currentCards.length === 0) return;

    const idsString = currentCards.map((card) => card.id).join(", ");

    setExtractedIds(idsString);
    setShowExtracted(true);

    try {
      await navigator.clipboard.writeText(idsString);
    } catch (err) {
      console.error("Failed to copy to clipboard", err);
    }
  }, [currentCards]);

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

      {/* Sticky Info Block */}
      <div className="sticky top-4 z-50 flex max-h-[45vh] flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex shrink-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-500">Owned:</span>{" "}
              <span className="font-semibold text-green-600">
                {ownedCountGlobal}
              </span>
              <span className="text-gray-400"> / {totalCards}</span>
            </div>
            <div>
              <span className="text-gray-500">Unowned:</span>{" "}
              <span className="font-semibold text-red-600">
                {totalCards - ownedCountGlobal}
              </span>
            </div>
          </div>

          <button
            onClick={extractAndCopyIds}
            disabled={currentCards.length === 0}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
          >
            📋 Copy current IDs
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 shrink-0">
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

        {extractedIds && (
          <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-gray-200 pt-3 dark:border-gray-700">
            <button
              onClick={() => setShowExtracted(!showExtracted)}
              className="group mb-2 flex w-full shrink-0 items-center justify-between text-left text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <span>Extracted IDs (copied to clipboard)</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 transition-transform duration-200 ${showExtracted ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showExtracted && (
              <div className="flex-1 overflow-auto rounded-lg bg-gray-100 p-3 font-mono text-sm break-all dark:bg-gray-800">
                {extractedIds}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      {currentSection === "all" ||
      currentSection === "unowned" ||
      currentSection === "spare" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {cardsToShow.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              value={
                collection[String(card.id)] ?? {
                  owned: false,
                  quantity: 1,
                }
              }
              onChange={(v) => updateCard(card.id, v)}
            />
          ))}
        </div>
      ) : (
        displayedGroups.map(({ label, code, cards }) => (
          <div key={label} className="scroll-mt-20">
            <GroupHeader
              label={label}
              code={code}
              cards={cards}
              collection={collection}
            />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {cards.map((card) => (
                <CardItem
                  key={card.id}
                  card={card}
                  value={
                    collection[String(card.id)] ?? {
                      owned: false,
                      quantity: 1,
                    }
                  }
                  onChange={(v) => updateCard(card.id, v)}
                />
              ))}
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
