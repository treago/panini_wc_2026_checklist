type Props = {
  label: string;
  cards: { id: string }[];
  collection: Record<string, { owned: boolean }>;
};

export function GroupHeader({ label, cards, collection }: Props) {
  const owned = cards.filter((card) => collection[card.id]?.owned).length;

  return (
    <div className="border-wc-red mb-8 flex items-center gap-4 rounded-r-3xl border-l-8 bg-white px-6 py-4 shadow-sm">
      <div className="text-wc-red text-4xl font-black tracking-widest uppercase">
        {label}
      </div>

      <div className="bg-wc-gold ml-auto rounded-2xl px-5 py-2 font-mono text-sm font-bold text-black">
        {owned}/{cards.length} CARDS
      </div>
    </div>
  );
}
