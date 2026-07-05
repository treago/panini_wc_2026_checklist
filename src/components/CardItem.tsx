import { memo, useEffect, useRef, useState } from "react";
import type { Card, CardPosition, CardType, CardValue } from "../types";

type Props = {
  card: Card;
  value: CardValue;
  onChange: (v: CardValue) => void;
  readOnly?: boolean;
  editMode?: boolean;
};

// Used on the position strip at the bottom of the image section.
const positionStrip: Partial<Record<CardType | CardPosition, string>> = {
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

export const CardItem = memo(function CardItem({
  card,
  value,
  onChange,
  readOnly = false,
  editMode = false,
}: Props) {
  const isOwned = value.owned;
  const currentQuantity = value.quantity ?? 1;
  const canEdit = editMode && !readOnly;

  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggleOwned = () => {
    if (!canEdit) return;
    onChange({
      owned: !isOwned,
      quantity: !isOwned ? Math.max(currentQuantity, 1) : currentQuantity,
    });
  };

  const handleQuantityChange = (next: number) => {
    if (!canEdit) return;
    const quantity = Math.max(0, next || 0);
    onChange(
      quantity === 0
        ? { owned: false, quantity: 0 }
        : { owned: true, quantity },
    );
  };

  return (
    <div
      ref={ref}
      data-card-id={card.id}
      onClick={toggleOwned}
      className={[
        "group flex flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-all duration-200 select-none",
        canEdit ? "cursor-pointer active:scale-[0.97]" : "cursor-default",
        isOwned
          ? "border-emerald-400 shadow-md shadow-emerald-200/60"
          : "border-gray-200",
      ].join(" ")}
    >
      {/* ── IMAGE SECTION ──────────────────────────────────────────────── */}
      {/* aspect-[3/4] is on this inner div only, so the image is always   */}
      {/* large regardless of how tall the footer ends up being.            */}
      <div className="relative aspect-3/4 overflow-hidden bg-linear-to-b from-gray-50 to-gray-100">
        {isVisible && (
          <img
            src={`${import.meta.env.BASE_URL}images/${card.image}`}
            alt={card.name}
            loading="lazy"
            className={[
              "absolute inset-0 h-full w-full object-contain p-2 transition-all duration-300",
              !isOwned ? "opacity-45 grayscale" : "",
              canEdit && !isOwned
                ? "group-hover:opacity-75 group-hover:grayscale-0"
                : "",
            ].join(" ")}
          />
        )}

        {/* Owned checkmark — top-left, small, never overlaps anything */}
        {isOwned && (
          <div className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12l5 5 9-9" />
            </svg>
          </div>
        )}

        {/* "Tap to add" hint — only visible in edit mode for unowned cards */}
        {!isOwned && canEdit && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-xl bg-black/50 px-3 py-1 text-[10px] font-bold tracking-widest text-white backdrop-blur-sm">
              TAP TO ADD
            </span>
          </div>
        )}

        {/* Position strip — sits at the very bottom of the image section.  */}
        {/* Always visible, never overlaps with the owned badge above.       */}
        <div
          className={[
            "absolute inset-x-0 bottom-0 truncate px-2 py-1 text-center text-[10px] leading-tight font-bold tracking-wide",
            positionStrip[card.position],
          ].join(" ")}
        >
          {card.position}
        </div>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-0.5 bg-white px-2.5 py-2">
        <div className="text-wc-red text-sm leading-none font-black">
          #{card.id}
        </div>
        <div className="line-clamp-2 text-xs leading-tight font-semibold text-gray-800">
          {card.name}
        </div>

        {/* Quantity controls — only when owned, editing, not read-only */}
        {isOwned && canEdit && (
          <div
            className="mt-1.5 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => handleQuantityChange(currentQuantity - 1)}
              disabled={currentQuantity <= 1}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100 disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <span className="w-5 text-center text-xs font-bold text-gray-800">
              {currentQuantity}
            </span>

            <button
              type="button"
              onClick={() => handleQuantityChange(currentQuantity + 1)}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100"
              aria-label="Increase quantity"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <span className="ml-0.5 text-[10px] text-gray-400">copies</span>
          </div>
        )}

        {/* Passive quantity display — read-only or locked mode, owned, >1 copy */}
        {isOwned && !canEdit && currentQuantity > 1 && (
          <div className="mt-0.5 text-[10px] font-semibold text-gray-400">
            {currentQuantity}×
          </div>
        )}
      </div>
    </div>
  );
});
