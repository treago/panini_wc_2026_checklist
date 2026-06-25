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

  const toCode = useCallback((key: string) => {
    const match = key.match(/\((.+?)\)/);
    return match ? match[1] : key.slice(0, 3).toUpperCase();
  }, []);

  // Flat list for ALL / UNOWNED / SPARE
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

  // Search ALL
  const filteredFlatCards = useMemo(() => {
    if (!formattedQuery) return allCards;

    return allCards.filter(
      (card) =>
        String(card.id).includes(formattedQuery) ||
        card.name.toLowerCase().includes(formattedQuery) ||
        card.position.toLowerCase().includes(formattedQuery),
    );
  }, [allCards, formattedQuery]);

  // Search grouped
  const filteredGroups = useMemo<Group[]>(() => {
    if (!formattedQuery) return groupedData;

    return groupedData
      .map((group) => ({
        ...group,
        cards: group.cards.filter(
          (card) =>
            String(card.id).includes(formattedQuery) ||
            card.name.toLowerCase().includes(formattedQuery) ||
            card.position.toLowerCase().includes(formattedQuery),
        ),
      }))
      .filter((group) => group.cards.length > 0);
  }, [groupedData, formattedQuery]);

  // Spare cards (quantity > 1) — for trading
  const spareCards = useMemo(() => {
    return filteredFlatCards.filter((card) => {
      const value = collection[String(card.id)];

      return value?.quantity && value.quantity > 1;
    });
  }, [filteredFlatCards, collection]);

  // Unowned
  const unownedCards = useMemo(() => {
    const seen = new Set<number>();

    return filteredFlatCards.filter((card) => {
      if (seen.has(card.id)) return false;

      seen.add(card.id);

      const value = collection[String(card.id)];

      return !value?.owned;
    });
  }, [filteredFlatCards, collection]);

  // Tabs logic
  const isFlatView =
    currentSection === "all" ||
    currentSection === "unowned" ||
    currentSection === "spare";

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

  return (
    <div className="space-y-16">
      <ChecklistHeader
        items={items}
        title={title}
        query={query}
        setQuery={setQuery}
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
      />

      {isFlatView ? (
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

      {(isFlatView
        ? cardsToShow.length === 0
        : displayedGroups.length === 0) && (
        <div className="py-20 text-center text-xl text-gray-400">
          No cards found matching your search.
        </div>
      )}
    </div>
  );
}
