export type Card = {
  id: number;
  name: string;
  position: string;
};

export type CountriesData = {
  [country: string]: Card[];
};

export type FifaCardsData = {
  GOLDEN_BALLERS: Card[];
  FAN_FAVOURITES: Card[];
  ICONS: Card[];
  LOGOS: Card[];
  CONTENDERS: Card[];
  TOP_KEEPERS: Card[];
  DEFENSIVE_ROCKS: Card[];
  MIDFIELD_MAESTROS: Card[];
  GOAL_MACHINES: Card[];
  MASTER_ROOKIES: Card[];
  OFFICIAL_EMBLEM: Card[];
  OFFICIAL_MASCOT: Card[];
  ETERNOS_22: Card[];
  COUNTRIES: CountriesData;
};

// Helper types
export type ChecklistProps = {
  title: string;
  items: FifaCardsData;
};

export type CardValue = {
  owned: boolean;
  quantity: number;
};
