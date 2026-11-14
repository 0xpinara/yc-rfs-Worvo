import { z } from "zod";
import { demoCatalog, type Catalog } from "./catalog";

// Prices edited on the Prices tab. Kept in server memory (like the invoice store) and applied on top
// of the saved catalog, so every new draft is priced from them. Existing invoices keep their snapshot.

export const MAX_PRICE_CENTS = 10_000_000; // $100,000

const Cents = z.number().int().min(1).max(MAX_PRICE_CENTS);

export const PriceUpdateSchema = z.strictObject({
  laborRateCents: Cents.optional(),
  items: z.array(z.strictObject({ id: z.string().min(1), unitCents: Cents })).max(200).optional(),
});

export type PriceUpdate = z.infer<typeof PriceUpdateSchema>;

type Overrides = { laborRateCents?: number; items: Record<string, number> };

const holder = globalThis as typeof globalThis & { __worvoPriceOverrides?: Overrides };

function overrides(): Overrides {
  holder.__worvoPriceOverrides ??= { items: {} };
  return holder.__worvoPriceOverrides;
}

export function applyOverrides(catalog: Catalog, saved: Overrides): Catalog {
  return {
    ...catalog,
    laborRateCents: saved.laborRateCents ?? catalog.laborRateCents,
    items: catalog.items.map((item) => ({ ...item, unitCents: saved.items[item.id] ?? item.unitCents })),
  };
}

/** The catalog every live invoice is priced from: saved setup plus any edits from the Prices tab. */
export function savedCatalog(env: Record<string, string | undefined> = process.env): Catalog {
  return applyOverrides(demoCatalog(env), overrides());
}

/** Applies an edit. Unknown item ids are rejected so a typo can't silently do nothing. */
export function savePrices(update: PriceUpdate, env: Record<string, string | undefined> = process.env): Catalog {
  const known = new Set(demoCatalog(env).items.map((item) => item.id));
  for (const item of update.items ?? []) {
    if (!known.has(item.id)) throw new Error(`Unknown item: ${item.id}`);
  }
  const saved = overrides();
  if (update.laborRateCents !== undefined) saved.laborRateCents = update.laborRateCents;
  for (const item of update.items ?? []) saved.items[item.id] = item.unitCents;
  return savedCatalog(env);
}
