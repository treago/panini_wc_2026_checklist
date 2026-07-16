import type { CardPosition, CardType } from "../types";

// Background/text classes for the position strip at the bottom of a card's
// image. Keyed loosely (CardType | CardPosition) because special/insert
// cards store a type-like label (e.g. "Golden Baller") in the `position`
// field rather than one of the four gameplay positions.
export const POSITION_STRIP_STYLES: Partial<
  Record<CardType | CardPosition, string>
> = {
  "Golden Baller": "bg-wc-gold text-black",
  "Fan Favourite": "bg-wc-gold text-black",
  Icon: "bg-wc-gold text-black",
  "Team Crest": "bg-wc-gold text-black",
  "Contender Match": "bg-wc-gold text-black",
  "Master Rookie": "bg-wc-gold text-black",
  "Official Emblem": "bg-wc-gold text-black",
  "Official Mascot": "bg-wc-gold text-black",
  "Eternos 22": "bg-wc-gold text-black",
  Goalkeeper: "bg-purple-700 text-white",
  "Top Keeper": "bg-purple-700 text-white",
  Defender: "bg-wc-red text-white",
  "Defensive Rock": "bg-wc-red text-white",
  Midfielder: "bg-orange-500 text-white",
  "Midfield Maestro": "bg-orange-500 text-white",
  Forward: "bg-wc-green text-white",
  "Goal Machine": "bg-wc-green text-white",
};

// Fallback for any position/type label not covered above, so the strip
// never renders with a missing background class.
export const DEFAULT_STRIP_STYLE = "bg-gray-600 text-white";

export function getPositionStripStyle(
  position: CardPosition | CardType | string,
): string {
  return (
    POSITION_STRIP_STYLES[position as CardType | CardPosition] ??
    DEFAULT_STRIP_STYLE
  );
}
