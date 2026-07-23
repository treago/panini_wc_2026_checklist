import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { CardValue, CollectionMeta } from "../types";

const DEFAULT_TOTAL_CARDS = 0;

export function useCollections(userId: string | null) {
  const [collections, setCollections] = useState<CollectionMeta[]>([]);
  const [loading, setLoading] = useState(!!userId);

  // Reset state during render when userId changes (e.g. user signs out).
  const [prevUserId, setPrevUserId] = useState(userId);
  if (userId !== prevUserId) {
    setPrevUserId(userId);
    setCollections([]);
    setLoading(!!userId);
  }

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "collections"),
      where("ownerId", "==", userId),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const cols: CollectionMeta[] = snap.docs.map((d) => {
          const cards = (d.data().cards ?? {}) as Record<
            string,
            { owned?: boolean }
          >;

          const ownedCount = Object.values(cards).filter(
            (c) => c?.owned,
          ).length;

          return {
            id: d.id,
            name: d.data().name ?? "Untitled",
            ownerId: d.data().ownerId ?? userId,
            ownerName: d.data().ownerName ?? "Unknown",
            shareEnabled: d.data().shareEnabled ?? false,
            createdAt:
              (d.data().createdAt as Timestamp)?.toMillis?.() ?? Date.now(),
            updatedAt:
              (d.data().updatedAt as Timestamp)?.toMillis?.() ?? Date.now(),
            ownedCount,
            catalogId: d.data().catalogId ?? null,
            totalCards: d.data().totalCards ?? DEFAULT_TOTAL_CARDS,
          };
        });

        cols.sort((a, b) => b.createdAt - a.createdAt);
        setCollections(cols);
        setLoading(false);
      },
      (err) => {
        console.error("useCollections snapshot error", err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [userId]);

  const createCollection = useCallback(
    async (
      name: string,
      ownerId: string,
      ownerName?: string,
      initialCards?: Record<string, CardValue>,
      catalogId?: string | null,
      totalCards?: number,
    ): Promise<string> => {
      const docRef = await addDoc(collection(db, "collections"), {
        name,
        ownerId,
        ownerName: ownerName ?? "Anonymous",
        shareEnabled: false,
        cards: initialCards ?? {},
        catalogId: catalogId ?? null,
        totalCards: totalCards ?? DEFAULT_TOTAL_CARDS,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    [],
  );

  const toggleShare = useCallback(
    async (collectionId: string, enabled: boolean): Promise<void> => {
      await updateDoc(doc(db, "collections", collectionId), {
        shareEnabled: enabled,
      });
    },
    [],
  );

  const deleteCollection = useCallback(
    async (collectionId: string): Promise<void> => {
      await deleteDoc(doc(db, "collections", collectionId));
    },
    [],
  );

  const renameCollection = useCallback(
    async (collectionId: string, name: string): Promise<void> => {
      await updateDoc(doc(db, "collections", collectionId), { name });
    },
    [],
  );

  return {
    collections,
    loading,
    createCollection,
    toggleShare,
    deleteCollection,
    renameCollection,
  };
}
