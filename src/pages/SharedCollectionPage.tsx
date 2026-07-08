import { useParams, Link } from "react-router-dom";
import { useCollection } from "../hooks/useCollection";
import { useCatalog } from "../hooks/useCatalog";
import { AuthButton } from "../components/AuthButton";
import Checklist from "../components/Checklist";

export default function SharedCollectionPage() {
  const { collectionId } = useParams<{ collectionId: string }>();

  const {
    collection,
    updateCard,
    loading,
    notFound,
    accessDenied,
    collectionName,
    ownerName,
    shareEnabled,
    catalogId,
  } = useCollection(collectionId ?? null, null, true /* readOnly */);

  const {
    cardsData,
    numbered,
    loading: catalogLoading,
  } = useCatalog(catalogId);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading || catalogLoading || !cardsData) {
    return (
      <main className="to-wc-dark flex min-h-screen items-center justify-center bg-linear-to-br from-emerald-950 via-emerald-900 text-white">
        <span className="animate-pulse text-lg text-emerald-300">Loading…</span>
      </main>
    );
  }

  // Not found, permission denied, or sharing turned off
  if (notFound || accessDenied || (!loading && !shareEnabled)) {
    return (
      <main className="to-wc-dark flex min-h-screen items-center justify-center bg-linear-to-br from-emerald-950 via-emerald-900 text-white">
        <div className="px-6 text-center">
          <div className="mb-5 text-6xl">🔒</div>
          <h2 className="mb-3 text-2xl font-bold">Collection not available</h2>
          <p className="mx-auto mb-8 max-w-sm text-gray-400">
            This collection is private or doesn't exist.
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

  // ── Shared view ──────────────────────────────────────────────────────────
  return (
    <main className="to-wc-dark min-h-screen bg-linear-to-br from-emerald-950 via-emerald-900 text-white">
      {/* Header */}
      <div className="border-wc-gold bg-wc-red border-b-4 py-5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-white">
                {collectionName || "Shared Collection"}
              </h1>
              <p className="text-wc-gold/70 mt-0.5 text-sm font-semibold">
                {ownerName ? `${ownerName}'s collection` : "Shared collection"}{" "}
                · {cardsData.meta.publisher.toUpperCase()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
              >
                Create your own →
              </Link>
              <AuthButton />
            </div>
          </div>
        </div>
      </div>

      {/* Read-only banner */}
      <div className="border-b border-blue-500/20 bg-blue-900/30 py-2 text-center text-sm text-blue-300">
        👁 Read-only view · Cards cannot be edited
      </div>

      {/* Checklist */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Checklist
          title={cardsData.meta.title}
          items={cardsData}
          numbered={numbered}
          section="all"
          collection={collection}
          updateCard={updateCard}
          readOnly={true}
        />
      </div>

      <div className="border-wc-gold/30 border-t bg-black/80 py-6 text-center text-sm text-gray-300">
        Values based on Panini Editorial Board • Keep one card in the front, one
        in the back • Insert your cards in the pockets
      </div>
    </main>
  );
}
