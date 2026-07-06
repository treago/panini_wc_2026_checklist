import { useEffect, useState } from "react";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { CatalogMeta } from "../types";

/**
 * Streams the list of card-set catalogs stored in Firestore.
 *
 * Firestore security rules must allow reads on /catalogs/{id} for all users
 * (including unauthenticated ones so shared views work):
 *
 *   match /catalogs/{id} {
 *     allow read: if true;
 *     allow write: if false;   // manage via Firebase Console or an admin tool
 *   }
 */
export function useCatalogs() {
  const [catalogs, setCatalogs] = useState<CatalogMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "catalogs"),
      (snap) => {
        const list: CatalogMeta[] = snap.docs.map((d) => {
          const raw = d.data();
          // Support both { meta: {...}, data: {...} } and a flat structure.
          const meta = raw.meta ?? raw;
          return {
            id: d.id,
            title: meta.title ?? "Untitled Catalog",
            publisher: meta.publisher ?? "",
            total_cards: meta.total_cards ?? 0,
            createdAt: (raw.createdAt as Timestamp)?.toMillis?.() ?? Date.now(),
          };
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        setCatalogs(list);
        setLoading(false);
      },
      (err) => {
        console.error("useCatalogs snapshot error:", err);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  return { catalogs, loading };
}
