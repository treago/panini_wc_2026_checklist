export type CardPosition = "Goalkeeper" | "Defender" | "Midfielder" | "Forward";

export type CardType =
  | "Common"
  | "Fan Favourite"
  | "Golden Baller"
  | "Icon"
  | "Team Crest"
  | "Contender Match"
  | "Master Rookie"
  | "Official Emblem"
  | "Official Mascot"
  | "Eternos 22"
  | "Top Keeper"
  | "Defensive Rock"
  | "Midfield Maestro"
  | "Goal Machine"
  | "Limited Edition"
  | "Limited Edition Premium"
  | "Limited Edition Gold"
  | "Limited Edition Hologram";

export type Card = {
  id: string;
  number?: number;
  name: string;
  // NOTE: in practice this field also carries special-card labels (e.g.
  // "Golden Baller", "Icon") for insert cards, so it is treated as a plain
  // string wherever it's used for filtering/lookup rather than narrowed to
  // CardPosition. See src/constants/cardStyles.ts.
  position: CardPosition;
  country?: string;
  image: string;
};

export type CardsData = {
  meta: Meta;
  data: Record<CardType, Card[]>;
};

export const CHECKLIST_GROUPS = ["all", "unowned", "spare", "grouped"] as const;
export type ChecklistGroup = (typeof CHECKLIST_GROUPS)[number];

// How cards are bucketed when the "grouped" tab is active.
export const GROUP_BY_MODES = ["type", "country"] as const;
export type GroupByMode = (typeof GROUP_BY_MODES)[number];

export interface CatalogMeta extends Meta {
  id: string;
  createdAt: number;
}

export interface Meta {
  title: string;
  publisher: string;
  total_cards: number;
}

export type CollectionMeta = {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  shareEnabled: boolean;
  createdAt: number;
  updatedAt: number;
  ownedCount: number;
  catalogId: string;
  totalCards: number;
};

export type CardValue = {
  owned: boolean;
  quantity: number;
};
