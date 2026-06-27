export type CardPosition =
  | "Golden Baller"
  | "Fan Favourite"
  | "Icon"
  | "Team Crest"
  | "Contender Match"
  | "Master Rookie"
  | "Official Emblem"
  | "Official Mascot"
  | "Eternos 22"
  | "Goalkeeper"
  | "Top Keeper"
  | "Defender"
  | "Defensive Rock"
  | "Midfielder"
  | "Midfield Maestro"
  | "Forward"
  | "Goal Machine";

export type Card = {
  id: number;
  name: string;
  position: CardPosition;
};

export type CardValue = {
  owned: boolean;
  quantity: number;
};

export const CHECKLIST_GROUPS = ["all", "unowned", "spare", "grouped"] as const;
export type ChecklistGroup = (typeof CHECKLIST_GROUPS)[number];

export type FifaCardsData = {
  meta: {
    title: string;
    publisher: string;
    total_cards: number;
  };
  special: Record<string, Card[]>;
  countries: Record<string, Card[]>;
};

export type CollectionMeta = {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  shareEnabled: boolean;
  createdAt: number;
  updatedAt: number;
  ownedCount: number;
};
