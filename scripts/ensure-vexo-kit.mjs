import { existsSync, cpSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const vendored = path.join(root, "third_party", "vexo-open-kit", "js", "src", "index.js");
const siblingSrc = path.resolve(root, "..", "vexo-open-kit", "js", "src");
const siblingLicense = path.resolve(root, "..", "vexo-open-kit", "LICENSE");
const destRoot = path.join(root, "third_party", "vexo-open-kit");

if (existsSync(vendored)) {
  console.log("Vendored vexo-open-kit JS client OK:", vendored);
  process.exit(0);
}

if (!existsSync(siblingSrc)) {
  console.error("Missing vendored kit and sibling at", siblingSrc);
  console.error("Clone https://github.com/VexoAI-Org/vexo-open-kit.git next to this repo, then re-run.");
  process.exit(1);
}

mkdirSync(path.join(destRoot, "js"), { recursive: true });
cpSync(siblingSrc, path.join(destRoot, "js", "src"), { recursive: true });
if (existsSync(siblingLicense)) {
  cpSync(siblingLicense, path.join(destRoot, "LICENSE"));
}
console.log("Synced vendored kit JS client from sibling.");
