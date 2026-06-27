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

export function useCollections(userId: string | null) {
  const [collections, setCollections] = useState<CollectionMeta[]>([]);
  const [loading, setLoading] = useState(!!userId);

  // Reset state during render when userId changes (e.g. user signs out).
  // This is the React-recommended pattern for adjusting state when a prop changes
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
  const [prevUserId, setPrevUserId] = useState(userId);
  if (userId !== prevUserId) {
    setPrevUserId(userId);
    setCollections([]);
    setLoading(!!userId);
  }

  useEffect(() => {
    if (!userId) {
      // State is already reset during the render phase above; nothing to do here.
      return;
    }

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
    ): Promise<string> => {
      const docRef = await addDoc(collection(db, "collections"), {
        name,
        ownerId,
        ownerName: ownerName ?? "Anonymous",
        shareEnabled: false,
        cards: initialCards ?? {},
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
