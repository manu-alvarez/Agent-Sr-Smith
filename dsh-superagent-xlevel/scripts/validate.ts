import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";

const ajv = new Ajv2020({ allErrors: true, strict: false });

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith(".json") ? [path] : [];
  });
}

let failed = 0;
for (const file of walk("schemas")) {
  try {
    ajv.compile(JSON.parse(readFileSync(file, "utf8")) as object);
  } catch (error) {
    failed += 1;
    console.error(file, error instanceof Error ? error.message : error);
  }
}
if (failed) process.exitCode = 1;
else console.log(`schemas compilados: ${walk("schemas").length}`);
