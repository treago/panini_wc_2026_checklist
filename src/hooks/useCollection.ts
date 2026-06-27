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
  // Initialize loading/syncing true only when we actually have an ID to fetch.
  const [collection, setCollection] = useState<Collection>({});
  const [loading, setLoading] = useState(!!collectionId);
  const [syncing, setSyncing] = useState(!!collectionId);
  const [notFound, setNotFound] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [ownerName, setOwnerName] = useState<string | undefined>(undefined);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  // Adjust state during render when collectionId changes — the React-recommended
  // pattern for prop-driven state resets. All setState calls here are in the
  // render body (not inside an effect), which is intentional and correct.
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
    } else {
      // New collectionId — mark as loading/syncing immediately in render
      // so there's never a flash of stale data.
      setLoading(true);
      setSyncing(true);
    }
  }

  useEffect(() => {
    if (!collectionId) {
      // All state already reset in the render phase above.
      return;
    }

    // No setState here — loading and syncing were already set to true
    // during the render phase when collectionId changed, so calling them
    // again here would be the synchronous-setState-in-effect anti-pattern.
    const docRef = doc(db, "collections", collectionId);

    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        // These are all inside an async callback — allowed by the rule.
        if (!snap.exists()) {
          setNotFound(true);
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
        setLoading(false);
        setSyncing(false);
      },
      (err) => {
        console.error("Firestore onSnapshot error", err);
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

  // userId is included in deps directly — no ref needed.
  // Firebase auth keeps uid stable for the lifetime of a session,
  // so this doesn't cause extra re-subscriptions.
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
  };
}
