import type { InvoiceView, Proposal } from "../../shared/contracts";
import type { Catalog, CatalogCustomer, CatalogItem } from "./catalog";

export type PricedDraft = Pick<
  InvoiceView,
  "customerId" | "customerName" | "recipient" | "lines" | "subtotalCents" | "totalCents" | "taxPolicy" | "unresolved"
>;

/** Lowercase, strip accents and punctuation, and drop a trailing plural "s" so "Shutoff valves" matches "shutoff valve". */
export function matchKey(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/s$/, "");
}

function findByAlias<T extends { aliases: string[] }>(entries: T[], reference: string): T | null {
  const wanted = matchKey(reference);
  return entries.find((entry) => entry.aliases.some((alias) => matchKey(alias) === wanted)) ?? null;
}

/** Labor is billed per minute at an hourly rate, rounded half-up once to whole cents. */
export function laborCents(minutes: number, hourlyRateCents: number): number {
  const product = minutes * hourlyRateCents;
  if (!Number.isSafeInteger(product)) {
    throw new RangeError("Labor amount is too large");
  }
  return Math.floor((product + 30) / 60);
}

export function priceProposal(proposal: Proposal, catalog: Catalog): PricedDraft {
  const unresolved = new Set(proposal.unresolved);
  const lines: InvoiceView["lines"] = [];

  const customer: CatalogCustomer | null = proposal.customerReference
    ? findByAlias(catalog.customers, proposal.customerReference)
    : null;
  if (!customer) {
    unresolved.add("customer");
  } else if (!customer.recipient) {
    unresolved.add("recipient");
  }

  if (proposal.laborMinutes !== null) {
    lines.push({
      description: `${proposal.description} labor`,
      quantity: proposal.laborMinutes,
      unit: "minute",
      rateCents: catalog.laborRateCents,
      rateUnit: "hour",
      amountCents: laborCents(proposal.laborMinutes, catalog.laborRateCents),
    });
  } else if (proposal.laborEvidence !== null) {
    unresolved.add("labor");
  }

  for (const material of proposal.materials) {
    const item: CatalogItem | null = findByAlias(catalog.items, material.reference);
    if (!item) {
      unresolved.add(`price:${material.reference}`);
      continue;
    }
    lines.push({
      description: material.quantity === 1 ? item.name : item.pluralName,
      quantity: material.quantity,
      unit: "each",
      rateCents: item.unitCents,
      rateUnit: "each",
      amountCents: material.quantity * item.unitCents,
    });
  }

  if (lines.length === 0) {
    unresolved.add("lines");
  }

  const subtotalCents = lines.reduce((sum, line) => sum + line.amountCents, 0);
  return {
    customerId: customer?.id ?? null,
    customerName: customer?.name ?? null,
    recipient: customer?.recipient ?? null,
    lines,
    subtotalCents,
    totalCents: subtotalCents,
    // Synthetic demo setup: no tax is assessed. Not a real tax determination.
    taxPolicy: "synthetic_no_tax",
    unresolved: [...unresolved],
  };
}
