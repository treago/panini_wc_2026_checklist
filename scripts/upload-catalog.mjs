import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import process from "process";

const __dirname = dirname(fileURLToPath(import.meta.url));

function flag(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
}

const SERVICE_ACCOUNT_PATH = resolve(__dirname, "serviceAccountKey.json");
const CARDS_JSON_PATH = resolve(
  __dirname,
  flag("--file") ?? "../src/data/cards.json",
);
const CATALOG_ID = flag("--id");

initializeApp({
  credential: cert(JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf8"))),
});

const db = getFirestore();

async function run() {
  const cardsData = JSON.parse(readFileSync(CARDS_JSON_PATH, "utf8"));

  if (!cardsData?.meta || !cardsData?.data) {
    throw new Error(
      "JSON must have top-level { meta: { title, publisher, total_cards }, data: { ... } }",
    );
  }

  const payload = {
    meta: {
      title: cardsData.meta.title,
      publisher: cardsData.meta.publisher,
      total_cards: cardsData.meta.total_cards,
    },
    data: cardsData.data,
    createdAt: FieldValue.serverTimestamp(),
  };

  let docRef;

  if (CATALOG_ID) {
    docRef = db.collection("catalogs").doc(CATALOG_ID);
    await docRef.set(payload);
  } else {
    docRef = await db.collection("catalogs").add(payload);
  }

  console.log("\n✅  Catalog uploaded.");
  console.log(`    Document ID  : ${docRef.id}`);
  console.log(`    Title        : ${cardsData.meta.title}`);
  console.log(`    Publisher    : ${cardsData.meta.publisher}`);
  console.log(`    Total cards  : ${cardsData.meta.total_cards}`);
  console.log(`    Groups       : ${Object.keys(cardsData.data).join(", ")}`);
  console.log(
    `\n    ⚠️  Save this ID for the migration script:\n` +
      `       node scripts/migrate-collections.mjs --catalog-id ${docRef.id}\n`,
  );
}

run().catch((err) => {
  console.error("\n❌  Upload failed:", err.message);
  process.exit(1);
});

// 550e8400-e29b-41d4-a716-446655440000
// 661f9511-f3ac-52e5-b827-557766551111
