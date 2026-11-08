import { readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const inventory = JSON.parse(readFileSync(new URL("./inventory.json", import.meta.url), "utf8")) as string[];
const missing = inventory.filter((rel) => {
  try {
    return statSync(resolve(root, rel)).size < 20;
  } catch {
    return true;
  }
});
if (missing.length) {
  console.error(missing.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`inventario íntegro: ${inventory.length} archivos`);
}
