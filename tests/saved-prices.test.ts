import assert from "node:assert/strict";
import test from "node:test";
import { demoCatalog } from "../src/server/invoices/catalog";
import { applyOverrides, PriceUpdateSchema } from "../src/server/invoices/saved-prices";

test("edited prices replace the saved ones; everything else stays", () => {
  const base = demoCatalog({});
  const edited = applyOverrides(base, { laborRateCents: 13500, items: { "shutoff-valve": 2400 } });
  assert.equal(edited.laborRateCents, 13500);
  assert.equal(edited.items[0].unitCents, 2400);
  assert.deepEqual(edited.customers, base.customers);
  assert.equal(base.laborRateCents, 12000, "the saved catalog itself is not mutated");
});

test("price edits must be whole cents within range", () => {
  assert.ok(PriceUpdateSchema.safeParse({ laborRateCents: 13500 }).success);
  assert.ok(!PriceUpdateSchema.safeParse({ laborRateCents: 135.5 }).success);
  assert.ok(!PriceUpdateSchema.safeParse({ laborRateCents: 0 }).success);
  assert.ok(!PriceUpdateSchema.safeParse({ items: [{ id: "x", unitCents: -1 }] }).success);
  assert.ok(!PriceUpdateSchema.safeParse({ laborRateCents: 100, totalCents: 1 }).success);
});
