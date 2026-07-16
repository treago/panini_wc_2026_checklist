import type { Card, CardValue } from "../types";
import type { CardGroup } from "../hooks/useCardFilters";
import type { Collection } from "../hooks/useCollection";
import { CardItem } from "./CardItem";
import { GroupHeader } from "./GroupHeader";

type Props = {
  flat: boolean;
  cards: Card[];
  groups: CardGroup[];
  collection: Collection;
  updateCard: (id: string, value: CardValue) => void;
  readOnly: boolean;
  editMode: boolean;
};

export function CardGrid({
  flat,
  cards,
  groups,
  collection,
  updateCard,
  readOnly,
  editMode,
}: Props) {
  const renderCard = (card: Card) => (
    <CardItem
      key={card.id}
      card={card}
      value={collection[card.id] ?? { owned: false, quantity: 1 }}
      onChange={(v) => updateCard(card.id, v)}
      readOnly={readOnly}
      editMode={editMode}
    />
  );

  if (flat) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {cards.map(renderCard)}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {groups.map(({ key, label, cards: groupCards }) => (
        <div key={key} className="scroll-mt-20">
          <GroupHeader
            label={label}
            cards={groupCards}
            collection={collection}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {groupCards.map(renderCard)}
          </div>
        </div>
      ))}
    </div>
  );
}
