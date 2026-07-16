import { useCallback, useDeferredValue, useMemo, useState } from "react";
import type { Card, CardsData, ChecklistGroup, GroupByMode } from "../types";
import type { Collection } from "./useCollection";
import {
  getCountryName,
  getCountryOptions,
  type CountryOption,
} from "../utils/country";

export type CardGroup = { key: string; label: string; cards: Card[] };

const ALL = "all" as const;

export function useCardFilters(
  items: CardsData,
  collection: Collection,
  initialSection: ChecklistGroup = "all",
) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const [section, setSection] = useState<ChecklistGroup>(initialSection);
  const [groupBy, setGroupBy] = useState<GroupByMode>("type");
  const [position, setPosition] = useState<string>(ALL);
  const [country, setCountry] = useState<string>(ALL);

  // Section/position/country/groupBy are all "filters" that live in the
  // sidebar and combine freely — changing one no longer resets the others
  // or the search query.
  const resetFilters = useCallback(() => {
    setPosition(ALL);
    setCountry(ALL);
    setSection(initialSection);
    setGroupBy("type");
  }, [initialSection]);

  // Flattened, de-duplicated, number-sorted list of every card in the set.
  const allCards = useMemo<Card[]>(() => {
    const map = new Map<string, Card>();
    Object.values(items.data || {})
      .flat()
      .forEach((card) => map.set(card.id, card));
    return Array.from(map.values()).sort(
      (a, b) =>
        (a.number ?? Number.MAX_SAFE_INTEGER) -
        (b.number ?? Number.MAX_SAFE_INTEGER),
    );
  }, [items]);

  const countryOptions = useMemo<CountryOption[]>(
    () => getCountryOptions(allCards.map((c) => c.country)),
    [allCards],
  );

  // Positions are read as raw strings (not narrowed to CardPosition) since
  // special/insert cards store a type-like label in this field too.
  const positionOptions = useMemo<string[]>(() => {
    const unique = new Set<string>();
    allCards.forEach((c) => unique.add(String(c.position)));
    return Array.from(unique).sort();
  }, [allCards]);

  const formattedQuery = deferredQuery.toLowerCase().trim();

  // Supports comma/space separated numeric lists, e.g. "12, 45, 100"
  const targetIds = useMemo<number[]>(() => {
    const match = formattedQuery.match(/^([\d\s,]+)$/);
    if (!match) return [];
    return match[1]
      .split(",")
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n));
  }, [formattedQuery]);

  const isIdArraySearch = targetIds.length > 0;

  const matchesQuery = useCallback(
    (card: Card) => {
      if (isIdArraySearch)
        return !!card.number && targetIds.includes(card.number);

      if (!formattedQuery) return true;

      // Match against the raw country code AND its resolved English name,
      // so both "br" and "brazil" find the same cards.
      const countryName = getCountryName(card.country).toLowerCase();

      return (
        String(card.number ?? "").includes(formattedQuery) ||
        card.name.toLowerCase().includes(formattedQuery) ||
        String(card.position).toLowerCase().includes(formattedQuery) ||
        !!card.country?.toLowerCase().includes(formattedQuery) ||
        countryName.includes(formattedQuery)
      );
    },
    [isIdArraySearch, targetIds, formattedQuery],
  );

  const matchesFilters = useCallback(
    (card: Card) => {
      if (position !== ALL && String(card.position) !== position) return false;
      if (country !== ALL && card.country?.toUpperCase() !== country)
        return false;
      return true;
    },
    [position, country],
  );

  const matchesAll = useCallback(
    (card: Card) => matchesQuery(card) && matchesFilters(card),
    [matchesQuery, matchesFilters],
  );

  const filteredCards = useMemo(
    () => allCards.filter(matchesAll),
    [allCards, matchesAll],
  );

  const spareCards = useMemo(
    () =>
      filteredCards.filter((card) => {
        const v = collection[card.id];
        return !!v?.quantity && v.quantity > 1;
      }),
    [filteredCards, collection],
  );

  const unownedCards = useMemo(
    () => filteredCards.filter((card) => !collection[card.id]?.owned),
    [filteredCards, collection],
  );

  const groupsByType = useMemo<CardGroup[]>(() => {
    return Object.entries(items.data || {})
      .map(([key, cards]) => ({
        key,
        label: key,
        cards: cards.filter(matchesAll),
      }))
      .filter((group) => group.cards.length > 0);
  }, [items, matchesAll]);

  const groupsByCountry = useMemo<CardGroup[]>(() => {
    const map = new Map<string, Card[]>();
    for (const card of filteredCards) {
      const key = card.country?.toUpperCase() ?? "UNKNOWN";
      const list = map.get(key) ?? [];
      list.push(card);
      map.set(key, list);
    }
    return Array.from(map.entries())
      .map(([key, cards]) => ({
        key,
        label: key === "UNKNOWN" ? "Unknown" : getCountryName(key),
        cards,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredCards]);

  const groups = groupBy === "country" ? groupsByCountry : groupsByType;

  const cardsToShow = useMemo(() => {
    if (section === "unowned") return unownedCards;
    if (section === "spare") return spareCards;
    return filteredCards;
  }, [section, unownedCards, spareCards, filteredCards]);

  const displayedGroups = useMemo(
    () => (section === "grouped" ? groups : []),
    [section, groups],
  );

  const currentCards = useMemo<Card[]>(() => {
    const cards =
      section === "grouped"
        ? displayedGroups.flatMap((g) => g.cards)
        : cardsToShow;
    const uniqueMap = new Map<string, Card>();
    for (const card of cards) uniqueMap.set(card.id, card);
    return Array.from(uniqueMap.values());
  }, [section, cardsToShow, displayedGroups]);

  const totalCards = allCards.length;

  const ownedCountGlobal = useMemo(
    () => allCards.filter((c) => collection[c.id]?.owned).length,
    [allCards, collection],
  );

  const hasActiveFilters =
    position !== ALL ||
    country !== ALL ||
    section !== initialSection ||
    (section === "grouped" && groupBy !== "type");

  return {
    query,
    setQuery,
    section,
    setSection,
    groupBy,
    setGroupBy,
    position,
    setPosition,
    country,
    setCountry,
    positionOptions,
    countryOptions,
    hasActiveFilters,
    resetFilters,
    allCards,
    cardsToShow,
    displayedGroups,
    currentCards,
    totalCards,
    ownedCountGlobal,
  };
}
