import fs from "fs";
import path from "path";
import crypto from "crypto";
import process from "process";

const dir = "./";
const jsonPath = path.join(dir, "limitedEditionCard.json");

// match like: 1.jpg, 23.png, etc. (filenames that are just the card id)
const regex = /^(\d+)(\.[a-zA-Z0-9]+)$/;

if (!fs.existsSync(jsonPath)) {
  console.error(`Could not find ${jsonPath}`);
  process.exit(1);
}

const cardData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const cards = Object.values(cardData.data).reduce(
  (curr, acc) => [...acc, ...curr],
  [],
);

// quick lookup: id -> card object
const cardById = new Map(cards.map((c) => [String(c.id), c]));

const files = fs
  .readdirSync(dir)
  .filter((f) => regex.test(f))
  .sort();

let updatedCount = 0;

for (const file of files) {
  const match = file.match(regex);
  const id = match[1];
  const ext = match[2];

  const card = cardById.get(id);
  if (!card) {
    console.warn(`⚠ No card found for id ${id} (file: ${file}), skipping`);
    continue;
  }

  const uuid = crypto.randomUUID();
  const newName = `${uuid}${ext}`;

  fs.renameSync(path.join(dir, file), path.join(dir, newName));

  // store the new filename on the matching card entry
  card.image = newName;
  updatedCount++;

  console.log(`${file} → ${newName} (card id ${id})`);
}

fs.writeFileSync(jsonPath, JSON.stringify(cardData, null, 2));
console.log(
  `\nRenamed ${updatedCount} file(s) and updated ${jsonPath} with new "image" fields.`,
);
