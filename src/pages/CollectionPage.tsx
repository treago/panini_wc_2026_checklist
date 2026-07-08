import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { useCollection } from "../hooks/useCollection";
import { useCatalog } from "../hooks/useCatalog";
import { AuthButton } from "../components/AuthButton";
import Checklist from "../components/Checklist";

export default function CollectionPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const { user } = useAuth();

  const {
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
  } = useCollection(collectionId ?? null, user?.uid ?? null);

  // catalogId is undefined while the collection is still loading, so useCatalog
  // stays in loading state too — no stale-data flash.
  const {
    cardsData,
    numbered,
    loading: catalogLoading,
  } = useCatalog(catalogId);

  const [copiedLink, setCopiedLink] = useState(false);

  const isOwner = !!user && !!ownerId && user.uid === ownerId;
  const canView = isOwner || shareEnabled;

  const handleToggleShare = async () => {
    if (!collectionId || !isOwner) return;
    await updateDoc(doc(db, "collections", collectionId), {
      shareEnabled: !shareEnabled,
    });
  };

  const handleCopyShareLink = async () => {
    const base = import.meta.env.BASE_URL as string;
    const url = `${window.location.origin}${base}share/${collectionId}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading || catalogLoading || !cardsData) {
    return (
      <main className="to-wc-dark flex min-h-screen items-center justify-center bg-linear-to-br from-emerald-950 via-emerald-900 text-white">
        <span className="animate-pulse text-lg text-emerald-300">
          Loading collection…
        </span>
      </main>
    );
  }

  // ── Error / access denied ────────────────────────────────────────────────
  if (notFound || accessDenied || (!loading && !canView)) {
    return (
      <main className="to-wc-dark flex min-h-screen items-center justify-center bg-linear-to-br from-emerald-950 via-emerald-900 text-white">
        <div className="px-6 text-center">
          <div className="mb-5 text-6xl">🔒</div>
          <h2 className="mb-3 text-2xl font-bold">
            {notFound ? "Collection not found" : "Access denied"}
          </h2>
          <p className="mx-auto mb-8 max-w-sm text-gray-400">
            {notFound
              ? "This collection doesn't exist or has been deleted."
              : "You don't have permission to view this collection."}
          </p>
          <Link
            to="/"
            className="bg-wc-red rounded-2xl px-6 py-3 font-bold text-white transition hover:bg-red-600"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────
  return (
    <main className="to-wc-dark min-h-screen bg-linear-to-br from-emerald-950 via-emerald-900 text-white">
      {/* Header */}
      <div className="border-wc-gold bg-wc-red border-b-4 py-5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Left: back + name */}
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex shrink-0 items-center gap-1 text-sm font-medium text-white/70 transition hover:text-white"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Collections
              </Link>
              <div className="h-5 w-px bg-white/20" />
              <div>
                <h1 className="text-2xl leading-tight font-black tracking-tighter text-white">
                  {collectionName}
                </h1>
                <p className="text-wc-gold/70 text-xs font-semibold">
                  {cardsData.meta.publisher.toUpperCase()} ·{" "}
                  {cardsData.meta.title.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Right: controls */}
            <div className="flex flex-wrap items-center gap-2">
              {syncing && (
                <span className="animate-pulse text-xs text-emerald-300">
                  Syncing…
                </span>
              )}

              {isOwner && (
                <>
                  <button
                    onClick={handleToggleShare}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                      shareEnabled
                        ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                        : "border-white/10 bg-black/30 text-gray-400 hover:bg-black/50 hover:text-white"
                    }`}
                  >
                    {shareEnabled ? "🔗 Shared" : "🔒 Private"}
                  </button>

                  {shareEnabled && (
                    <button
                      onClick={handleCopyShareLink}
                      className="cursor-pointer rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-gray-300 transition hover:bg-black/50 hover:text-white"
                    >
                      {copiedLink ? "✓ Copied!" : "Copy link"}
                    </button>
                  )}
                </>
              )}

              <AuthButton />
            </div>
          </div>
        </div>
      </div>

      {/* Read-only banner for non-owners */}
      {!isOwner && (
        <div className="border-b border-blue-500/20 bg-blue-900/30 py-2 text-center text-sm text-blue-300">
          👁 Viewing {ownerName ? `${ownerName}'s` : "a"} collection in
          read-only mode
        </div>
      )}

      {/* Checklist */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Checklist
          title={cardsData.meta.title}
          numbered={numbered}
          items={cardsData}
          section="all"
          collection={collection}
          updateCard={updateCard}
          readOnly={!isOwner}
        />
      </div>

      <div className="border-wc-gold/30 border-t bg-black/80 py-6 text-center text-sm text-gray-300">
        Values based on Panini Editorial Board • Keep one card in the front, one
        in the back • Insert your cards in the pockets
      </div>
    </main>
  );
}
