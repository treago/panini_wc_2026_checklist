import { useCallback, useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { CardValue } from "../types";

const LS_KEY = "fifaChecklists";

// Firestore stores map keys as strings; card IDs are numbers.
// JavaScript coerces numeric property access on string-keyed objects,
// so Record<string, CardValue> works with collection[card.id] at runtime.
export type Collection = Record<string, CardValue>;

function loadLS(): Collection {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLS(data: Collection) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("localStorage write failed", e);
  }
}

export function useCollection(userId: string | null) {
  const [collection, setCollection] = useState<Collection>(loadLS);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!userId) {
      // Not logged in — restore from localStorage
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollection(loadLS());
      return;
    }

    setSyncing(true);
    const docRef = doc(db, "users", userId);

    const unsubscribe = onSnapshot(
      docRef,
      async (snap) => {
        if (!snap.exists()) {
          // First ever login — migrate whatever's in localStorage
          const localData = loadLS();

          await setDoc(docRef, { cards: localData });

          setCollection(localData);
        } else {
          const cards = (snap.data()?.cards ?? {}) as Collection;

          setCollection(cards);
        }
        setSyncing(false);
      },
      (err) => {
        console.error("Firestore onSnapshot error", err);
        setSyncing(false);
      },
    );

    return unsubscribe;
  }, [userId]);

  const updateCard = useCallback(
    (id: number, value: CardValue) => {
      const key = String(id);

      // Optimistic local update
      setCollection((prev) => {
        const next = { ...prev, [key]: value };

        saveLS(next);

        return next;
      });

      if (userId) {
        const docRef = doc(db, "users", userId);
        // updateDoc writes only this one field — efficient and atomic
        updateDoc(docRef, { [`cards.${key}`]: value }).catch(() => {
          // Document doesn't exist yet (race on first login) — create it
          setDoc(docRef, { cards: { [key]: value } }, { merge: true });
        });
      }
    },
    [userId],
  );

  return { collection, updateCard, syncing };
}
