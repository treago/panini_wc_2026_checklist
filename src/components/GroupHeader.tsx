import { Badge } from "./ui/Badge";

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

      <Badge tone="gold" className="ml-auto font-mono">
        {owned}/{cards.length} CARDS
      </Badge>
    </div>
  );
}
