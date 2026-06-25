import data from "./data/cards.json";
import { AuthButton } from "./components/AuthButton";
import Checklist from "./components/Checklist";
import { useCollection } from "./hooks/useCollection";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const { user } = useAuth();
  const { collection, updateCard, syncing } = useCollection(user?.uid ?? null);

  return (
    <main className="to-wc-dark min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 text-white">
      {/* Header */}
      <div className="border-wc-gold bg-wc-red border-b-4 py-6">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div>
              <h1 className="text-5xl font-black tracking-tighter text-white">
                FIFA WORLD CUP 2026™
              </h1>
              <p className="text-wc-gold mt-1 text-xl font-semibold">
                CHECKLIST
              </p>
            </div>

            {/* Auth + sync status */}
            <div className="flex items-center gap-4">
              {syncing && (
                <span className="animate-pulse text-xs text-emerald-300">
                  Syncing…
                </span>
              )}
              <AuthButton />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Checklist
          title="Complete Collection"
          items={data}
          section="all"
          collection={collection}
          updateCard={updateCard}
        />
      </div>

      <div className="border-wc-gold/30 border-t bg-black/80 py-6 text-center text-sm text-gray-300">
        Values based on Panini Editorial Board • Keep one card in the front, one
        in the back • Insert your cards in the pockets
      </div>
    </main>
  );
}
