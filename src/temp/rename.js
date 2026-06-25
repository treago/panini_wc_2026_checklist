import fs from "fs";
import path from "path";

const dir = "./";
let counter = 92;

// match like: 123_s-l1600.jpg
const regex = /^\d+_s-l1600(\.[a-zA-Z0-9]+)$/;
// const regex = /^\d+(\.[a-zA-Z0-9]+)$/;

const files = fs
  .readdirSync(dir)
  .filter((f) => regex.test(f))
  .sort(); // optional stable order

for (const file of files) {
  const ext = path.extname(file);
  const newName = `${counter}${ext}`;

  fs.renameSync(path.join(dir, file), path.join(dir, newName));

  console.log(`${file} → ${newName}`);
  counter++;
}
