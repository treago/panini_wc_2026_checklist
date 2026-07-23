import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { useCollections } from "../hooks/useCollections";
import { useCatalogs } from "../hooks/useCatalogs";
import { AuthButton } from "../components/AuthButton";
import type { CollectionMeta } from "../types";

const DEFAULT_TOTAL_CARDS = 0;
const OLD_LS_KEY = "fifaChecklists";

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    collections,
    loading: collectionsLoading,
    createCollection,
    toggleShare,
    deleteCollection,
    renameCollection,
  } = useCollections(user?.uid ?? null);

  // Catalog list for the "New Collection" picker
  const { catalogs, loading: catalogsLoading } = useCatalogs();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  // null = use built-in default; string = Firestore catalog ID
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(
    null,
  );

  const [migrating, setMigrating] = useState(false);
  const [hasOldFirestoreData, setHasOldFirestoreData] = useState(false);
  const [dismissedMigration, setDismissedMigration] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const hasOldLocalData = useMemo(() => {
    if (
      dismissedMigration ||
      !user ||
      collectionsLoading ||
      collections.length > 0
    )
      return false;
    try {
      const raw = localStorage.getItem(OLD_LS_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Object.keys(parsed).length > 0;
    } catch {
      return false;
    }
  }, [dismissedMigration, user, collectionsLoading, collections.length]);

  useEffect(() => {
    if (
      dismissedMigration ||
      !user ||
      collectionsLoading ||
      collections.length > 0
    )
      return;

    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        if (snap.exists()) {
          const cards = snap.data()?.cards ?? {};
          if (Object.keys(cards).length > 0) setHasOldFirestoreData(true);
        }
      })
      .catch(() => {});
  }, [user, collections.length, collectionsLoading, dismissedMigration]);

  // Resolve the selected catalog's total_cards for caching in the collection doc.
  const selectedTotalCards = useMemo(() => {
    if (!selectedCatalogId) return DEFAULT_TOTAL_CARDS;
    return (
      catalogs.find((c) => c.id === selectedCatalogId)?.total_cards ??
      DEFAULT_TOTAL_CARDS
    );
  }, [selectedCatalogId, catalogs]);

  const resetCreateForm = () => {
    setShowCreateForm(false);
    setNewName("");
    setSelectedCatalogId(null);
  };

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    try {
      const id = await createCollection(
        newName.trim(),
        user.uid,
        user.displayName ?? undefined,
        undefined,
        selectedCatalogId,
        selectedTotalCards,
      );
      navigate(`/collection/${id}`);
    } catch (err) {
      console.error("Failed to create collection", err);
      setCreating(false);
    }
  };

  const handleMigrateLocal = async () => {
    if (!user) return;
    setMigrating(true);
    try {
      const raw = localStorage.getItem(OLD_LS_KEY);
      if (!raw) return;
      const oldCards = JSON.parse(raw);
      const id = await createCollection(
        "My Collection",
        user.uid,
        user.displayName ?? undefined,
        oldCards,
        null,
        DEFAULT_TOTAL_CARDS,
      );
      localStorage.removeItem(OLD_LS_KEY);
      navigate(`/collection/${id}`);
    } catch (err) {
      console.error("Local migration failed", err);
    } finally {
      setMigrating(false);
    }
  };

  const handleMigrateFirestore = async () => {
    if (!user) return;
    setMigrating(true);
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) return;
      const oldCards = snap.data()?.cards ?? {};
      const id = await createCollection(
        "My Collection",
        user.uid,
        user.displayName ?? undefined,
        oldCards,
        null,
        DEFAULT_TOTAL_CARDS,
      );
      setHasOldFirestoreData(false);
      navigate(`/collection/${id}`);
    } catch (err) {
      console.error("Firestore migration failed", err);
    } finally {
      setMigrating(false);
    }
  };

  const handleRename = async (colId: string) => {
    if (!renameValue.trim()) return;
    try {
      await renameCollection(colId, renameValue.trim());
    } finally {
      setRenamingId(null);
      setRenameValue("");
    }
  };

  const handleDelete = async (colId: string) => {
    try {
      await deleteCollection(colId);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleCopyShareLink = async (colId: string) => {
    const base = import.meta.env.BASE_URL as string;
    const url = `${window.location.origin}${base}share/${colId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(colId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const isLoading = authLoading || (!!user && collectionsLoading);
  const showMigration =
    !dismissedMigration && (hasOldLocalData || hasOldFirestoreData);

  // Whether the Firestore catalog picker should appear.
  const showCatalogPicker = !catalogsLoading && catalogs.length > 0;

  return (
    <main className="to-wc-dark min-h-screen bg-linear-to-br from-emerald-950 via-emerald-900 text-white">
      {/* Header */}
      <div className="border-wc-gold bg-wc-red border-b-4 py-6">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div>
              <h1 className="text-5xl font-black tracking-tighter text-white">
                FIFA WORLD CUP 2026™
              </h1>
              <p className="text-wc-gold mt-1 text-xl font-semibold">
                ADRENALYN XL CHECKLIST
              </p>
            </div>
            <AuthButton />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-24">
            <span className="animate-pulse text-lg text-emerald-300">
              Loading…
            </span>
          </div>
        )}

        {/* Signed out */}
        {!authLoading && !user && (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="mb-6 text-7xl">⚽</div>
            <h2 className="mb-4 text-4xl font-black tracking-tight">
              Track your Panini collection
            </h2>
            <p className="mb-3 max-w-md text-lg text-emerald-300">
              Create multiple collections, track every card, and share your
              progress with friends.
            </p>
            <p className="text-sm text-gray-500">
              Sign in with Google to get started. Shared collections can be
              viewed without an account.
            </p>
          </div>
        )}

        {/* Signed in */}
        {!authLoading && user && !collectionsLoading && (
          <div className="space-y-6">
            {/* Migration banner */}
            {showMigration && (
              <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-5">
                <h3 className="mb-1 text-lg font-bold text-yellow-300">
                  📦 We found existing card data
                </h3>
                <p className="mb-4 text-sm text-yellow-200/70">
                  Import it to keep your progress in the new multi-collection
                  system.
                </p>
                <div className="flex flex-wrap gap-2">
                  {hasOldLocalData && (
                    <button
                      onClick={handleMigrateLocal}
                      disabled={migrating}
                      className="cursor-pointer rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:opacity-50"
                    >
                      {migrating ? "Importing…" : "Import from browser storage"}
                    </button>
                  )}
                  {hasOldFirestoreData && (
                    <button
                      onClick={handleMigrateFirestore}
                      disabled={migrating}
                      className="cursor-pointer rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:opacity-50"
                    >
                      {migrating ? "Importing…" : "Import from cloud"}
                    </button>
                  )}
                  <button
                    onClick={() => setDismissedMigration(true)}
                    className="cursor-pointer rounded-xl border border-yellow-500/30 px-4 py-2 text-sm text-yellow-400/70 transition hover:text-yellow-300"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Top row */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight">
                {collections.length > 0
                  ? `My Collections (${collections.length})`
                  : "My Collections"}
              </h2>
              <button
                onClick={() => setShowCreateForm((v) => !v)}
                className="bg-wc-gold flex cursor-pointer items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-black shadow transition hover:bg-yellow-400"
              >
                <span className="text-base leading-none">+</span>
                New Collection
              </button>
            </div>

            {/* Create form */}
            {showCreateForm && (
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="mb-3 text-sm font-semibold text-gray-300">
                  Name your collection
                </p>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreate();
                      if (e.key === "Escape") resetCreateForm();
                    }}
                    placeholder="e.g. Main Collection, Trade List…"
                    className="focus:border-wc-gold/50 focus:ring-wc-gold/50 flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white transition placeholder:text-gray-600 focus:ring-1 focus:outline-none"
                  />
                  <button
                    onClick={handleCreate}
                    disabled={creating || !newName.trim()}
                    className="bg-wc-gold cursor-pointer rounded-xl px-5 py-2.5 text-sm font-bold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creating ? "Creating…" : "Create"}
                  </button>
                  <button
                    onClick={resetCreateForm}
                    className="cursor-pointer rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-500 transition hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                {/* ── Catalog picker (only shown when Firestore has extra catalogs) ── */}
                {showCatalogPicker && (
                  <div className="mt-4 border-t border-white/5 pt-4">
                    <p className="mb-2 text-xs font-bold tracking-widest text-gray-500 uppercase">
                      Card Set
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {catalogs.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCatalogId(cat.id)}
                          className={[
                            "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                            selectedCatalogId === cat.id
                              ? "bg-wc-gold text-black"
                              : "border border-white/10 text-gray-400 hover:border-white/20 hover:text-white",
                          ].join(" ")}
                        >
                          {cat.title}
                        </button>
                      ))}
                    </div>

                    {/* Info line for the selected catalog */}
                    <p className="mt-2 text-xs text-gray-600">
                      {selectedTotalCards} cards ·{" "}
                      {catalogs.find((c) => c.id === selectedCatalogId)
                        ?.publisher ?? ""}
                      {" · From Firestore"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {collections.length === 0 && !showCreateForm && (
              <div className="rounded-2xl border border-white/10 bg-black/20 py-20 text-center">
                <div className="mb-4 text-5xl">📋</div>
                <p className="mb-6 text-lg text-gray-400">
                  Create your first collection to start tracking
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-wc-gold cursor-pointer rounded-2xl px-6 py-3 font-bold text-black transition hover:bg-yellow-400"
                >
                  + New Collection
                </button>
              </div>
            )}

            {/* Collections grid */}
            {collections.length > 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {collections.map((col) => (
                  <CollectionCard
                    key={col.id}
                    col={col}
                    renamingId={renamingId}
                    renameValue={renameValue}
                    confirmDeleteId={confirmDeleteId}
                    copiedId={copiedId}
                    onRenameStart={(id, name) => {
                      setRenamingId(id);
                      setRenameValue(name);
                    }}
                    onRenameChange={setRenameValue}
                    onRenameSubmit={handleRename}
                    onRenameCancel={() => {
                      setRenamingId(null);
                      setRenameValue("");
                    }}
                    onToggleShare={() => toggleShare(col.id, !col.shareEnabled)}
                    onCopyShareLink={() => handleCopyShareLink(col.id)}
                    onDeleteStart={() => setConfirmDeleteId(col.id)}
                    onDeleteConfirm={() => handleDelete(col.id)}
                    onDeleteCancel={() => setConfirmDeleteId(null)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-wc-gold/30 border-t bg-black/80 py-6 text-center text-sm text-gray-300">
        Values based on Panini Editorial Board • Keep one card in the front, one
        in the back • Insert your cards in the pockets
      </div>
    </main>
  );
}

// ─── Collection card sub-component ───────────────────────────────────────────

type CollectionCardProps = {
  col: CollectionMeta;
  renamingId: string | null;
  renameValue: string;
  confirmDeleteId: string | null;
  copiedId: string | null;
  onRenameStart: (id: string, name: string) => void;
  onRenameChange: (v: string) => void;
  onRenameSubmit: (id: string) => void;
  onRenameCancel: () => void;
  onToggleShare: () => void;
  onCopyShareLink: () => void;
  onDeleteStart: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
};

function CollectionCard({
  col,
  renamingId,
  renameValue,
  confirmDeleteId,
  copiedId,
  onRenameStart,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onToggleShare,
  onCopyShareLink,
  onDeleteStart,
  onDeleteConfirm,
  onDeleteCancel,
}: CollectionCardProps) {
  // Use the per-collection totalCards cached at creation time.
  const totalCards = col.totalCards;
  const progress =
    totalCards > 0 ? Math.round((col.ownedCount / totalCards) * 100) : 0;
  const isRenaming = renamingId === col.id;
  const isConfirmDelete = confirmDeleteId === col.id;
  const isCopied = copiedId === col.id;

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-black/40 p-5 transition hover:border-white/20">
      {/* Name row */}
      <div className="mb-4">
        {isRenaming ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onRenameSubmit(col.id);
                if (e.key === "Escape") onRenameCancel();
              }}
              className="focus:ring-wc-gold/50 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white focus:ring-1 focus:outline-none"
            />
            <button
              onClick={() => onRenameSubmit(col.id)}
              className="text-wc-gold cursor-pointer text-xs hover:underline"
            >
              Save
            </button>
            <button
              onClick={onRenameCancel}
              className="cursor-pointer text-xs text-gray-500 hover:text-white"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="flex-1 truncate text-xl leading-tight font-black tracking-tight">
              {col.name}
            </h3>
            <button
              onClick={() => onRenameStart(col.id, col.name)}
              className="shrink-0 cursor-pointer text-gray-600 transition hover:text-gray-300"
              aria-label="Rename"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        )}
        <p className="mt-1 text-xs text-gray-600">
          Created {new Date(col.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-gray-400">
            <span className="font-semibold text-green-400">
              {col.ownedCount}
            </span>
            <span className="text-gray-600"> / {totalCards} owned</span>
          </span>
          <span className="font-bold text-gray-300">{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-linear-to-r from-green-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Share section */}
      <div className="mb-4 rounded-xl border border-white/5 bg-white/5 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
            {col.shareEnabled ? "🔗 Shared" : "🔒 Private"}
          </span>
          <button
            onClick={onToggleShare}
            className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full transition-colors duration-200 ${
              col.shareEnabled ? "bg-emerald-500" : "bg-gray-700"
            }`}
            aria-label="Toggle sharing"
          >
            <span
              className={`mt-0.5 inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                col.shareEnabled ? "ml-0.5 translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        {col.shareEnabled && (
          <button
            onClick={onCopyShareLink}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 transition hover:border-white/20 hover:text-white"
          >
            {isCopied ? "✓ Link copied!" : "📋 Copy share link"}
          </button>
        )}
        {!col.shareEnabled && (
          <p className="mt-2 text-xs text-gray-700">
            Enable to share a read-only view
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto flex gap-2">
        <Link
          to={`/collection/${col.id}`}
          className="bg-wc-red flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-red-600"
        >
          Open →
        </Link>

        {isConfirmDelete ? (
          <>
            <button
              onClick={onDeleteConfirm}
              className="cursor-pointer rounded-xl bg-red-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-600"
            >
              Delete
            </button>
            <button
              onClick={onDeleteCancel}
              className="cursor-pointer rounded-xl border border-white/10 px-3 py-2 text-xs text-gray-500 transition hover:text-white"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={onDeleteStart}
            className="cursor-pointer rounded-xl border border-white/10 px-3 py-2 text-gray-600 transition hover:border-red-400/30 hover:text-red-400"
            aria-label="Delete collection"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
