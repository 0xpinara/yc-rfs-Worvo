import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// shortcut: ESLint 9 matches Next's react plugin peers; upgrade when that plugin supports 10.
export default defineConfig([
  // design/ holds exported design references (with their own viewer scripts), not app code.
  globalIgnores(["third_party/**", "design/**"]),
  ...nextVitals,
  ...nextTypescript,
]);
