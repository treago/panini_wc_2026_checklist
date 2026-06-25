import {
  CHECKLIST_GROUPS,
  type ChecklistGroup,
  type FifaCardsData,
} from "../types";

type Props = {
  items: FifaCardsData;
  title: string;
  query: string;
  setQuery: (v: string) => void;
  currentSection: ChecklistGroup;
  setCurrentSection: (value: ChecklistGroup) => void;
};

export function ChecklistHeader({
  items,
  title,
  query,
  setQuery,
  currentSection,
  setCurrentSection,
}: Props) {
  return (
    <div className="mb-12 space-y-5">
      {/* Eyebrow + title */}
      <div>
        <p className="text-wc-gold/80 mb-1.5 text-xs font-bold tracking-[0.2em] uppercase">
          {items.meta.publisher} · {items.meta.total_cards} cards
        </p>
        <h2 className="text-4xl font-black tracking-tighter text-white">
          {title}
        </h2>
      </div>

      {/* Gold rule */}
      <div className="from-wc-gold/50 via-wc-gold/10 h-px bg-linear-to-r to-transparent" />

      {/* Controls row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex shrink-0 rounded-xl bg-black/40 p-1 ring-1 ring-white/10">
          {CHECKLIST_GROUPS.map((group) => (
            <button
              key={group}
              onClick={() => setCurrentSection(group)}
              className={`cursor-pointer rounded-lg px-5 py-2 text-xs font-bold tracking-widest uppercase transition-all duration-200 ${
                currentSection === group
                  ? "bg-wc-red text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {group}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-500"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by number, name or position…"
            className="focus:border-wc-gold/50 focus:ring-wc-gold/50 w-full rounded-xl border border-white/10 bg-black/40 py-3 pr-10 pl-11 text-sm text-white transition placeholder:text-gray-500 focus:ring-1 focus:outline-none"
          />

          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded-full p-0.5 text-gray-500 transition hover:text-white"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
