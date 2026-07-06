import { useCallback, useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { CardValue } from "../types";

export type Collection = Record<string, CardValue>;

export function useCollection(
  collectionId: string | null,
  userId: string | null,
  readOnly = false,
) {
  const [collection, setCollection] = useState<Collection>({});
  const [loading, setLoading] = useState(!!collectionId);
  const [syncing, setSyncing] = useState(!!collectionId);
  const [notFound, setNotFound] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [ownerName, setOwnerName] = useState<string | undefined>(undefined);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  /**
   * undefined = still resolving (waiting on Firestore)
   * null      = collection loaded; no catalogId stored → use built-in default
   * string    = collection loaded; use this Firestore catalog
   */
  const [catalogId, setCatalogId] = useState<string | null | undefined>(
    collectionId ? undefined : null,
  );

  // React-recommended pattern for adjusting state when a prop changes.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevCollectionId, setPrevCollectionId] = useState(collectionId);
  if (collectionId !== prevCollectionId) {
    setPrevCollectionId(collectionId);
    if (!collectionId) {
      setCollection({});
      setLoading(false);
      setSyncing(false);
      setNotFound(false);
      setAccessDenied(false);
      setCollectionName("");
      setOwnerName(undefined);
      setShareEnabled(false);
      setOwnerId(null);
      setCatalogId(null);
    } else {
      setLoading(true);
      setSyncing(true);
      setCatalogId(undefined); // reset until the new snapshot arrives
    }
  }

  useEffect(() => {
    if (!collectionId) return;

    const docRef = doc(db, "collections", collectionId);

    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true);
          setCatalogId(null); // unlock useCatalog so the error state renders
          setLoading(false);
          setSyncing(false);
          return;
        }

        const d = snap.data();
        setNotFound(false);
        setAccessDenied(false);
        setCollection((d?.cards ?? {}) as Collection);
        setCollectionName(d?.name ?? "Untitled");
        setOwnerName(d?.ownerName);
        setShareEnabled(d?.shareEnabled ?? false);
        setOwnerId(d?.ownerId ?? null);
        // Fall back to null (built-in default) if no catalogId was stored.
        setCatalogId(d?.catalogId ?? null);
        setLoading(false);
        setSyncing(false);
      },
      (err) => {
        console.error("Firestore onSnapshot error", err);
        setCatalogId(null); // unlock useCatalog so the error state renders
        if ((err as { code?: string }).code === "permission-denied") {
          setAccessDenied(true);
        } else {
          setNotFound(true);
        }
        setLoading(false);
        setSyncing(false);
      },
    );

    return unsubscribe;
  }, [collectionId]);

  const updateCard = useCallback(
    (id: number, value: CardValue) => {
      if (readOnly || !collectionId || !userId) return;

      const key = String(id);
      setCollection((prev) => ({ ...prev, [key]: value }));

      const docRef = doc(db, "collections", collectionId);
      updateDoc(docRef, { [`cards.${key}`]: value }).catch(() => {
        setDoc(docRef, { cards: { [key]: value } }, { merge: true });
      });
    },
    [collectionId, userId, readOnly],
  );

  return {
    collection,
    updateCard,
    loading,
    syncing,
    notFound,
    accessDenied,
    collectionName,
    ownerName,
    shareEnabled,
    ownerId,
    catalogId,
  };
}
