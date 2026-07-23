import { useCallback, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { CardsData } from "../types";

/**
 * Loads a card catalog's full data.
 *
 *   catalogId === undefined  →  parent hasn't resolved yet; stay loading
 *   catalogId === null       →  use built-in cards.json
 *   catalogId === "abc123"   →  fetch from Firestore `catalogs` collection
 *
 * Always falls back to the built-in default on any Firestore error.
 */
export function useCatalog(catalogId: string | null | undefined) {
  // Initialize synchronously from the first value so there's never a
  // spurious loading flash on the initial render.
  const [cardsData, setCardsData] = useState<CardsData | null>(null);
  const [numbered, setNumbered] = useState<boolean>(false);
  const [loading, setLoading] = useState(catalogId !== null);

  const isNumbered = useCallback((cardsData: CardsData | null) => {
    return Object.values(cardsData?.data ?? {}).some((cards) =>
      cards.some((card) => card.number !== undefined),
    );
  }, []);

  // React-recommended pattern for adjusting state when a prop changes.
  // setState calls here are in the render body, not inside an effect, which
  // is intentional and correct — they only fire when catalogId changes.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevCatalogId, setPrevCatalogId] = useState(catalogId);

  if (catalogId !== prevCatalogId) {
    setPrevCatalogId(catalogId);

    if (catalogId === undefined) {
      // Parent collection hasn't resolved yet — stay in loading state.
      setCardsData(null);
      setLoading(true);
    } else if (catalogId === null) {
      // Explicitly no catalog — use the built-in default immediately.
      setCardsData(null);
      setNumbered(isNumbered(null));
      setLoading(false);
    } else {
      // New Firestore catalog ID — reset and let the effect below fetch it.
      setCardsData(null);
      setLoading(true);
    }
  }

  // This effect only runs for real Firestore catalog IDs. The synchronous
  // cases (undefined / null) are fully handled in the render phase above so
  // no setState is called synchronously inside this effect body.
  useEffect(() => {
    if (!catalogId) return; // covers both undefined and null

    getDoc(doc(db, "catalogs", catalogId))
      .then((snap) => {
        if (snap.exists()) {
          const raw = snap.data();
          const parsed: CardsData = {
            meta: raw.meta ?? {
              title: raw.title ?? "Untitled",
              publisher: raw.publisher ?? "",
              total_cards: raw.total_cards ?? 0,
            },
            data: (raw.data ?? {}) as Record<string, import("../types").Card[]>,
          };
          setCardsData(parsed);
          setNumbered(isNumbered(parsed));
        } else {
          console.warn(
            `Catalog "${catalogId}" not found — using built-in default.`,
          );
          setCardsData(null);
          setNumbered(isNumbered(null));
        }
      })
      .catch((err) => {
        console.error("useCatalog fetch error:", err);
        setCardsData(null);
        setNumbered(isNumbered(null));
      })
      .finally(() => setLoading(false));
  }, [catalogId, isNumbered]);

  return { cardsData, numbered, loading };
}
