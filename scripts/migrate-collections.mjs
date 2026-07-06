import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import process from "process";

const __dirname = dirname(fileURLToPath(import.meta.url));

function flag(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
}

const CATALOG_ID = flag("--catalog-id");

if (!CATALOG_ID) {
  console.error(
    "\n❌  Missing required flag: --catalog-id <firestoreCatalogDocumentId>\n" +
      "    Run upload-catalog.mjs first and copy the printed Document ID.\n",
  );
  process.exit(1);
}

initializeApp({
  credential: cert(
    JSON.parse(
      readFileSync(resolve(__dirname, "serviceAccountKey.json"), "utf8"),
    ),
  ),
});

const db = getFirestore();

function serializeDoc(data) {
  if (data === null || data === undefined) return data;
  if (data?.toDate instanceof Function) return data.toDate().toISOString();
  if (Array.isArray(data)) return data.map(serializeDoc);
  if (typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, serializeDoc(v)]),
    );
  }
  return data;
}

function writeBackup(docs) {
  const backupDir = resolve(__dirname, "backups");
  mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = resolve(backupDir, `collections-${timestamp}.json`);

  const payload = {
    createdAt: new Date().toISOString(),
    catalogId: CATALOG_ID,
    count: docs.length,
    documents: docs.map((d) => ({
      id: d.id,
      path: d.ref.path,
      data: serializeDoc(d.data()),
    })),
  };

  writeFileSync(backupPath, JSON.stringify(payload, null, 2), "utf8");
  return backupPath;
}

async function run() {
  const catalogSnap = await db.collection("catalogs").doc(CATALOG_ID).get();
  if (!catalogSnap.exists) {
    throw new Error(
      `Catalog "${CATALOG_ID}" not found in Firestore. ` +
        `Run upload-catalog.mjs first.`,
    );
  }

  const totalCards = catalogSnap.data().meta?.total_cards;
  if (typeof totalCards !== "number") {
    throw new Error(`Catalog "${CATALOG_ID}" is missing meta.total_cards.`);
  }

  console.log(`\n📋  Catalog found: "${catalogSnap.data().meta?.title}"`);
  console.log(`    total_cards = ${totalCards}`);

  const collectionsSnap = await db.collection("collections").get();
  const needsMigration = collectionsSnap.docs.filter(
    (d) => !d.data().catalogId,
  );

  if (needsMigration.length === 0) {
    console.log(
      "\n✅  Nothing to migrate — all collections already have a catalogId.\n",
    );
    return;
  }

  console.log(`\n📦  Found ${needsMigration.length} collection(s) to migrate.`);

  const backupPath = writeBackup(needsMigration);
  console.log(`\n💾  Backup written to:\n    ${backupPath}`);

  const BATCH_SIZE = 500;
  let migrated = 0;

  console.log(`\n🔄  Migrating…`);

  for (let i = 0; i < needsMigration.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = needsMigration.slice(i, i + BATCH_SIZE);

    for (const doc of chunk) {
      batch.update(doc.ref, {
        catalogId: CATALOG_ID,
        totalCards,
      });
    }

    await batch.commit();
    migrated += chunk.length;
    console.log(`    …${migrated} / ${needsMigration.length}`);
  }

  console.log(`\n✅  Migration complete.`);
  console.log(`    Collections updated : ${migrated}`);
  console.log(`    catalogId           : ${CATALOG_ID}`);
  console.log(`    totalCards          : ${totalCards}`);
  console.log(`    Backup              : ${backupPath}\n`);
}

run().catch((err) => {
  console.error("\n❌  Migration failed:", err.message);
  console.error("    No documents were modified after the point of failure.\n");
  process.exit(1);
});
