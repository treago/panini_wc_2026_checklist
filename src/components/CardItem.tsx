import { memo, useEffect, useRef, useState } from "react";
import type { Card, CardPosition, CardValue } from "../types";

type Props = {
  card: Card;
  value: CardValue;
  onChange: (v: CardValue) => void;
};

const positionClassNames: Record<CardPosition, string> = {
  // === GOLDEN / SPECIAL POSITIONS (Gold theme) ===
  "Golden Baller": "bg-wc-gold text-black shadow-md ring-1 ring-black/10",
  "Fan Favourite": "bg-wc-gold text-black shadow-md ring-1 ring-black/10",
  Icon: "bg-wc-gold text-black shadow-md ring-1 ring-black/10",
  "Team Crest": "bg-wc-gold text-black shadow-md ring-1 ring-black/10",
  "Contender Match": "bg-wc-gold text-black shadow-md ring-1 ring-black/10",
  "Master Rookie": "bg-wc-gold text-black shadow-md ring-1 ring-black/10",
  "Official Emblem": "bg-wc-gold text-black shadow-md ring-1 ring-black/10",
  "Official Mascot": "bg-wc-gold text-black shadow-md ring-1 ring-black/10",
  "Eternos 22": "bg-wc-gold text-black shadow-md ring-1 ring-black/10",

  // === MAIN POSITION CATEGORIES (based on your image) ===

  // Goalkeeper family → Purple
  Goalkeeper: "bg-purple-700 text-white shadow-md ring-1 ring-black/10",
  "Top Keeper": "bg-purple-700 text-white shadow-md ring-1 ring-black/10",

  // Defender family → Red
  Defender: "bg-wc-red text-white shadow-md ring-1 ring-black/10",
  "Defensive Rock": "bg-wc-red text-white shadow-md ring-1 ring-black/10",

  // Midfielder family → Orange
  Midfielder: "bg-orange-500 text-white shadow-md ring-1 ring-black/10",
  "Midfield Maestro": "bg-orange-500 text-white shadow-md ring-1 ring-black/10",

  // Forward family → Green
  Forward: "bg-wc-green text-white shadow-md ring-1 ring-black/10",
  "Goal Machine": "bg-wc-green text-white shadow-md ring-1 ring-black/10",
} as const;

export const CardItem = memo(function CardItem({
  card,
  value,
  onChange,
}: Props) {
  const isOwned = value.owned;
  const currentQuantity = value.quantity ?? 1;

  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px", // pre-load slightly before entering viewport
      },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const toggleOwned = () => {
    onChange({
      owned: !isOwned,
      quantity: currentQuantity,
    });
  };

  const handleQuantityChange = (newQuantity: number) => {
    onChange({
      owned: true,
      quantity: Math.max(1, newQuantity || 1),
    });
  };

  return (
    <div
      ref={ref}
      data-card-id={card.id}
      onClick={toggleOwned}
      className={`group relative flex aspect-255/340 cursor-pointer flex-col overflow-hidden rounded-3xl border-2 bg-white shadow-sm transition-all duration-300 ${
        isOwned
          ? "border-wc-green ring-wc-green/30 ring-1"
          : "hover:border-wc-gold/60 border-gray-200"
      }`}
    >
      {/* IMAGE SECTION */}
      <div className="relative flex-1 overflow-hidden bg-linear-to-b from-white via-white to-gray-50">
        <div
          className={`h-full w-full p-4 transition-all duration-300 ${
            isOwned
              ? ""
              : "group-hover:blur-0 opacity-70 blur-[2px] grayscale-60 group-hover:opacity-100 group-hover:grayscale-0"
          }`}
        >
          {isVisible && (
            <img
              src={`${import.meta.env.BASE_URL}images/${card.id}.webp`}
              alt={card.name}
              loading="lazy"
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
            />
          )}
        </div>

        {/* POSITION BADGE */}
        <div
          className={`absolute top-4 right-4 rounded-xl bg-black/80 px-3 py-1 text-xs font-bold tracking-wide ${
            positionClassNames[card.position]
          }`}
        >
          {card.position}
        </div>

        {/* OWNED BADGE */}
        {isOwned && (
          <div className="bg-wc-green absolute top-4 left-4 rounded-xl px-3 py-1 text-xs font-bold text-white shadow-md ring-1 ring-black/10">
            ✓ OWNED
          </div>
        )}

        {/* UNOPENED OVERLAY */}
        {!isOwned && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-2xl bg-black/40 px-4 py-2 text-xs font-bold tracking-widest text-white backdrop-blur-md">
              UNOPENED
            </div>
          </div>
        )}

        {/* subtle pattern overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--color-wc-gold)_0.6px,transparent_1px)] opacity-[0.04]" />
      </div>

      {/* FOOTER */}
      <div className="border-t border-gray-100 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-wc-red text-xl font-black tracking-tight">
              #{card.id}
            </div>

            <div className="mt-0.5 line-clamp-2 text-sm font-semibold text-gray-900">
              {card.name}
            </div>
          </div>
        </div>

        {/* QUANTITY SELECTOR */}
        {isOwned && (
          <div
            className="mt-1 flex items-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
              Quantity
            </span>

            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 shadow-xs">
              <button
                type="button"
                onClick={() => handleQuantityChange(currentQuantity - 1)}
                disabled={currentQuantity <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                aria-label="Decrease quantity"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>

              <input
                type="number"
                min={1}
                value={currentQuantity}
                onChange={(e) => handleQuantityChange(Number(e.target.value))}
                className="focus:text-wc-gold w-10 [appearance:textfield] bg-transparent text-center text-sm font-bold text-gray-800 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />

              <button
                type="button"
                onClick={() => handleQuantityChange(currentQuantity + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-100 hover:text-gray-900"
                aria-label="Increase quantity"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
