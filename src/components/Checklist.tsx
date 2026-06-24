import React, {
  useCallback,
  useMemo,
  useState,
  useDeferredValue,
  useEffect,
} from "react";
import type { Card, CardValue, FifaCardsData } from "../types";
import { CardItem } from "./CardItem";

type Props = {
  title: string;
  items: FifaCardsData;
  section?: "all" | "special" | "countries";
};

export default function Checklist({ title, items, section = "all" }: Props) {
  const [collection, setCollection] = useState<Record<number, CardValue>>({});
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [currentSection, setCurrentSection] = useState(section);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem("fifaChecklists", JSON.stringify(collection));
    } catch (e) {
      console.error("Failed to save collection", e);
    }
  }, [collection]);

  // hydrate
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fifaChecklists");
      if (saved) setCollection(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to load collection", e);
    }
  }, []);

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

      // Clean up the display name (e.g., convert "GOLDEN_BALLERS" to "GOLDEN BALLERS")
      const cleanName = key
        .replace(/\s*\(.+?\)/, "")
        .replace(/_/g, " ")
        .trim();

      groups.push({
        country: cleanName,
        code,
        cards: [...cards],
        type,
      });
    };

    // 1. Process root-level special categories arrays
    Object.entries(items).forEach(([key, value]) => {
      if (key !== "COUNTRIES" && Array.isArray(value)) {
        addGroup(key, value, "special");
      }
    });

    // 2. Process the uppercase COUNTRIES object map
    if (items.COUNTRIES) {
      Object.entries(items.COUNTRIES).forEach(([key, cards]) => {
        addGroup(key, cards, "countries");
      });
    }

    return groups;
  }, [items]);

  const updateCard = useCallback(
    (id: number, value: CardValue) => {
      setCollection((prev) => {
        const newCollection = { ...prev, [id]: value };

        return newCollection;
      });
    },
    [groupedData],
  );

  // Filter groups by search query string
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

  // Filter groups by active sub-tab view ("ALL" | "SPECIAL" | "COUNTRIES")
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
              <button
                onClick={() => setCurrentSection("all")}
                className={`rounded-xl px-5 py-1.5 text-sm font-semibold transition ${
                  currentSection === "all"
                    ? "bg-wc-red text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                ALL
              </button>

              <button
                onClick={() => setCurrentSection("special")}
                className={`rounded-xl px-5 py-1.5 text-sm font-semibold transition ${
                  currentSection === "special"
                    ? "bg-wc-red text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                SPECIAL
              </button>

              <button
                onClick={() => setCurrentSection("countries")}
                className={`rounded-xl px-5 py-1.5 text-sm font-semibold transition ${
                  currentSection === "countries"
                    ? "bg-wc-red text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                COUNTRIES
              </button>
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

      {/* Groups Grid */}
      {displayedGroups.map(({ country, code, cards }) => (
        <div key={country} className="scroll-mt-20">
          {/* Country Header */}
          <div className="border-wc-red mb-8 flex items-center gap-4 rounded-r-3xl border-l-8 bg-white px-6 py-4 shadow-sm">
            <div className="text-wc-red text-4xl font-black tracking-widest uppercase">
              {country}
            </div>

            <div className="text-2xl font-bold text-gray-600">({code})</div>

            <div className="bg-wc-gold ml-auto rounded-2xl px-5 py-2 font-mono text-sm font-bold text-black">
              {cards.length} CARDS
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {cards.map((card) => {
              const value = collection[card.id] ?? {
                owned: false,
                quantity: 1,
              };

              return (
                <CardItem
                  key={card.id}
                  card={card}
                  value={value}
                  onChange={(v) => updateCard(card.id, v)}
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
