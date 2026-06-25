// ============================================================
// FIFA World Cup 2026 Adrenalyn XL — Types
// Matches JSON structure: { meta, special, countries }
// ============================================================

export type Card = {
  id: number;
  name: string;
  position: CardPosition;
};

// ------------------------------------------------------------------
// Meta
// ------------------------------------------------------------------

export type Meta = {
  title: string;
  publisher: string;
  total_cards: number;
};

// ------------------------------------------------------------------
// Special categories (keys match JSON exactly)
// ------------------------------------------------------------------

export type SpecialCards = {
  "Golden Ballers": Card[];
  "Fan Favourites": Card[];
  Icons: Card[];
  Logos: Card[];
  Contenders: Card[];
  "Top Keepers": Card[];
  "Defensive Rocks": Card[];
  "Midfield Maestros": Card[];
  "Goal Machines": Card[];
  "Master Rookies": Card[];
  "Official Emblem": Card[];
  "Official Mascot": Card[];
  "Eternos 22": Card[];
};

// Subset type for the 514–630 special-only JSON
export type SpecialCards514to630 = Omit<
  SpecialCards,
  "Golden Ballers" | "Fan Favourites" | "Icons" | "Logos"
>;

// ------------------------------------------------------------------
// Countries
// ------------------------------------------------------------------

export type Country =
  | "Algeria"
  | "Argentina"
  | "Australia"
  | "Austria"
  | "Belgium"
  | "Brazil"
  | "Canada"
  | "Cape Verde"
  | "Colombia"
  | "Croatia"
  | "Curaçao"
  | "Ecuador"
  | "Egypt"
  | "England"
  | "France"
  | "Germany"
  | "Ghana"
  | "Haiti"
  | "Iran"
  | "Ivory Coast"
  | "Japan"
  | "Jordan"
  | "Korea Republic"
  | "Mexico"
  | "Morocco"
  | "Netherlands"
  | "New Zealand"
  | "Norway"
  | "Panama"
  | "Paraguay"
  | "Portugal"
  | "Qatar"
  | "Saudi Arabia"
  | "Scotland"
  | "Senegal"
  | "South Africa"
  | "Spain"
  | "Switzerland"
  | "Tunisia"
  | "United States"
  | "Uruguay"
  | "Uzbekistan";

export type CardPosition =
  | "Golden Baller"
  | "Fan Favourite"
  | "Icon"
  | "Team Crest"
  | "Contender Match"
  | "Midfielder"
  | "Forward"
  | "Defender"
  | "Goalkeeper"
  | "Top Keeper"
  | "Defensive Rock"
  | "Midfield Maestro"
  | "Goal Machine"
  | "Master Rookie"
  | "Official Emblem"
  | "Official Mascot"
  | "Eternos 22";

export type CountriesData = Record<Country, Card[]>;

// ------------------------------------------------------------------
// Root JSON shapes
// ------------------------------------------------------------------

export type FifaCardsData = {
  meta: Meta;
  special: SpecialCards;
  countries: CountriesData;
};

// ------------------------------------------------------------------
// Helper / UI types
// ------------------------------------------------------------------

export type SpecialCategory = keyof SpecialCards;

export type CardValue = {
  owned: boolean;
  quantity: number;
};

/** Keyed by card id */
export type CollectionState = Record<number, CardValue>;

export type ChecklistProps = {
  title: string;
  data: FifaCardsData;
};

export const CHECKLIST_GROUPS = ["all", "grouped", "unowned", "spare"] as const;
export type ChecklistGroup = (typeof CHECKLIST_GROUPS)[number];
