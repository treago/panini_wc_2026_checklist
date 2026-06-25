import { useCallback, useMemo, useState, useDeferredValue } from "react";
import type { Card, CardValue, FifaCardsData } from "../types";
import type { Collection } from "../hooks/useCollection";
import { CardItem } from "./CardItem";

type Props = {
  title: string;
  items: FifaCardsData;
  section?: "all" | "special" | "countries";
  collection: Collection;
  updateCard: (id: number, value: CardValue) => void;
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

  // Structural mapping of flat JSON into standardized UI groups
  const groupedData = useMemo(() => {
    const groups: {
      country: string;
      code: string;
      cards: Card[];
      type: "special" | "countries";
    }[] = [];

    const addGroup = (
      key: string,
      cards: Card[],
      type: "special" | "countries",
    ) => {
      const codeMatch = key.match(/\((.+?)\)/);
      const code = codeMatch ? codeMatch[1] : key.slice(0, 3).toUpperCase();

      const cleanName = key
        .replace(/\s*\(.+?\)/, "")
        .replace(/_/g, " ")
        .trim();

      groups.push({ country: cleanName, code, cards: [...cards], type });
    };

    Object.entries(items).forEach(([key, value]) => {
      if (key !== "COUNTRIES" && Array.isArray(value)) {
        addGroup(key, value, "special");
      }
    });

    if (items.COUNTRIES) {
      Object.entries(items.COUNTRIES).forEach(([key, cards]) => {
        addGroup(key, cards, "countries");
      });
    }

    return groups;
  }, [items]);

  const handleUpdateCard = useCallback(
    (id: number, value: CardValue) => {
      updateCard(id, value);
    },
    [updateCard],
  );

  // Filter by search query
  const filteredGroups = useMemo(() => {
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
  const displayedGroups = useMemo(() => {
    if (currentSection === "all") return filteredGroups;
    return filteredGroups.filter((g) => g.type === currentSection);
  }, [filteredGroups, currentSection]);

  const canSwitch = section === "all" && groupedData.length > 0;

  return (
    <div className="space-y-16">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-center gap-3">
          <h2 className="text-4xl font-black tracking-tighter text-white">
            {title}
          </h2>

          {canSwitch && (
            <div className="border-wc-gold/30 flex rounded-2xl border bg-zinc-900 p-1">
              {(["all", "special", "countries"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setCurrentSection(s)}
                  className={`rounded-xl px-5 py-1.5 text-sm font-semibold transition ${
                    currentSection === s
                      ? "bg-wc-red text-white shadow-lg"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search number, player or position..."
          className="border-wc-gold/30 focus:border-wc-gold focus:ring-wc-gold w-full rounded-2xl border bg-zinc-950 px-6 py-3.5 text-lg text-white outline-none placeholder:text-gray-500 focus:ring-1 sm:w-96"
        />
      </div>

      {/* Groups */}
      {displayedGroups.map(({ country, code, cards }) => (
        <div key={country} className="scroll-mt-20">
          <div className="border-wc-red mb-8 flex items-center gap-4 rounded-r-3xl border-l-8 bg-white px-6 py-4 shadow-sm">
            <div className="text-wc-red text-4xl font-black tracking-widest uppercase">
              {country}
            </div>
            <div className="text-2xl font-bold text-gray-600">({code})</div>
            <div className="bg-wc-gold ml-auto rounded-2xl px-5 py-2 font-mono text-sm font-bold text-black">
              {cards.length} CARDS
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {cards.map((card) => {
              // Use String(card.id) because Firestore stores map keys as strings
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
