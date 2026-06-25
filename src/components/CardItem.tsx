import React, { memo } from "react";
import type { Card, CardValue } from "../types";

type Props = {
  card: Card;
  value: CardValue;
  onChange: (v: CardValue) => void;
};

const positionColors: Record<string, string> = {
  GK: "bg-wc-green text-white shadow-md ring-1 ring-black/10",
  DF: "bg-wc-red text-white shadow-md ring-1 ring-black/10",
  MF: "bg-wc-blue text-white shadow-md ring-1 ring-black/10",
  FW: "bg-wc-gold text-black shadow-md ring-1 ring-black/10",
  LOGO: "bg-wc-gold text-black shadow-md ring-1 ring-black/10",
};

export const CardItem = memo(function CardItem({
  card,
  value,
  onChange,
}: Props) {
  const isOwned = value.owned;

  const toggleOwned = () => {
    onChange({
      owned: !isOwned,
      quantity: value.quantity ?? 1,
    });
  };

  return (
    <div
      data-card-id={card.id}
      onClick={toggleOwned}
      className={`group relative flex aspect-[255/340] cursor-pointer flex-col overflow-hidden rounded-3xl border-2 bg-white shadow-sm transition-all duration-300 ${
        isOwned
          ? "border-wc-green ring-wc-green/30 ring-1"
          : "hover:border-wc-gold/60 border-gray-200"
      }`}
    >
      {/* IMAGE SECTION */}
      <div className="relative flex-1 overflow-hidden bg-gradient-to-b from-white via-white to-gray-50">
        <div
          className={`h-full w-full p-4 transition-all duration-300 ${
            isOwned
              ? ""
              : "group-hover:blur-0 opacity-70 blur-[2px] grayscale-[60%] group-hover:opacity-100 group-hover:grayscale-0"
          }`}
        >
          <img
            src={`${import.meta.env.BASE_URL}images/${card.id}.webp`}
            alt={card.name}
            loading="lazy"
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
          />
        </div>

        {/* POSITION BADGE */}
        <div
          className={`absolute top-4 right-4 rounded-xl px-3 py-1 text-xs font-extrabold tracking-wide ${positionColors[card.position]}`}
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

        {/* QUANTITY */}
        {isOwned && (
          <div
            className="mt-4 flex items-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs font-medium text-gray-500">Quantity</span>

            <input
              type="number"
              min={1}
              value={value.quantity ?? 1}
              onChange={(e) =>
                onChange({
                  owned: true,
                  quantity: Math.max(1, Number(e.target.value) || 1),
                })
              }
              className="focus:border-wc-gold focus:ring-wc-gold w-16 rounded-xl border border-gray-200 bg-gray-50 px-2 py-1 text-center text-sm font-semibold text-gray-800 transition outline-none focus:bg-white focus:ring-1"
            />
          </div>
        )}
      </div>
    </div>
  );
});
