import { useCallback, useMemo, useState, useDeferredValue } from "react";
import type { Card, CardValue, FifaCardsData } from "../types";
import type { Collection } from "../hooks/useCollection";
import { CardItem } from "./CardItem";
import { GroupHeader } from "./GroupHeader";
import { ChecklistHeader } from "./ChecklistHeader";

type Props = {
  title: string;
  items: FifaCardsData;
  section?: "all" | "special" | "countries";
  collection: Collection;
  updateCard: (id: number, value: CardValue) => void;
};

type Group = {
  label: string;
  code: string;
  cards: Card[];
  type: "special" | "countries";
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

  // Build UI groups from the new { special, countries } structure
  const groupedData = useMemo<Group[]>(() => {
    const groups: Group[] = [];

    const toCode = (key: string) => {
      const match = key.match(/\((.+?)\)/);
      return match ? match[1] : key.slice(0, 3).toUpperCase();
    };

    // Special categories: "Golden Ballers", "Fan Favourites", etc.
    for (const [key, cards] of Object.entries(items.special)) {
      groups.push({
        label: key,
        code: toCode(key),
        cards: [...cards],
        type: "special",
      });
    }

    // Country sections: "Algeria", "Argentina", etc.
    for (const [key, cards] of Object.entries(items.countries)) {
      groups.push({
        label: key,
        code: toCode(key),
        cards: [...cards],
        type: "countries",
      });
    }

    return groups;
  }, [items]);

  const handleUpdateCard = useCallback(
    (id: number, value: CardValue) => updateCard(id, value),
    [updateCard],
  );

  // Filter by search query (deferred so typing stays snappy)
  const filteredGroups = useMemo<Group[]>(() => {
    const q = deferredQuery.toLowerCase().trim();
    if (!q) return groupedData;

    return groupedData
      .map((group) => ({
        ...group,
        cards: group.cards.filter(
          (c) =>
            String(c.id).includes(q) ||
            c.name.toLowerCase().includes(q) ||
            c.position.toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.cards.length > 0);
  }, [groupedData, deferredQuery]);

  // Filter by active sub-tab
  const displayedGroups = useMemo<Group[]>(() => {
    if (currentSection === "all") return filteredGroups;
    return filteredGroups.filter((g) => g.type === currentSection);
  }, [filteredGroups, currentSection]);

  const canSwitch = section === "all" && groupedData.length > 0;

  return (
    <div className="space-y-16">
      {/* Header */}
      <ChecklistHeader
        items={items}
        title={title}
        query={query}
        setQuery={setQuery}
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
        canSwitch={canSwitch}
      />

      {/* Groups */}
      {displayedGroups.map(({ label, code, cards }) => (
        <div key={label} className="scroll-mt-20">
          <GroupHeader
            label={label}
            code={code}
            cards={cards}
            collection={collection}
          />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {cards.map((card) => {
              // Firestore stores map keys as strings
              const value = collection[String(card.id)] ?? {
                owned: false,
                quantity: 1,
              };
              return (
                <CardItem
                  key={card.id}
                  card={card}
                  value={value}
                  onChange={(v) => handleUpdateCard(card.id, v)}
                />
              );
            })}
          </div>
        </div>
      ))}

      {displayedGroups.length === 0 && (
        <div className="py-20 text-center text-xl text-gray-400">
          No cards found matching your search.
        </div>
      )}
    </div>
  );
}
