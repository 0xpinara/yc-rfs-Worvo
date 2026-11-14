import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_PROPOSAL } from "../src/fixtures/invoice";
import { demoCatalog } from "../src/server/invoices/catalog";
import { priceProposal } from "../src/server/invoices/pricing";

test("soft Gemini unresolved notes do not block a catalog-priced draft", () => {
  const priced = priceProposal(
    {
      ...DEMO_PROPOSAL,
      unresolved: [
        "Missing catalog rate cue for labor (usual rate)",
        "Customer billing email is not provided in transcript",
      ],
    },
    demoCatalog({ INVOICE_TEST_RECIPIENT: "billing@juniper-cafe.example.com" }),
  );
  assert.equal(priced.totalCents, 22500);
  assert.deepEqual(priced.unresolved, []);
});

test("normalizeForFixtureMatch treats Vorvo as Worvo", async () => {
  const { normalizeForFixtureMatch, transcriptsMatch } = await import("../src/server/extraction/normalize");
  const demo = "Worvo, invoice Juniper Cafe for today's sink repair.";
  assert.equal(
    transcriptsMatch(`Vorvo, invoice Juniper Cafe for today's sink repair.`, demo),
    true,
  );
  assert.match(normalizeForFixtureMatch("Vorvo hello"), /worvo/);
});
