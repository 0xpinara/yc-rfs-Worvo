import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// shortcut: ESLint 9 matches Next's react plugin peers; upgrade when that plugin supports 10.
export default defineConfig([
  globalIgnores(["third_party/**"]),
  ...nextVitals,
  ...nextTypescript,
]);
