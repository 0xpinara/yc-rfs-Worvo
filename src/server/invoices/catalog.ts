// The one plumber's saved setup for the demo. Prices live here, never in model output.
export type CatalogCustomer = {
  id: string;
  name: string;
  aliases: string[];
  recipient: string | null;
};

export type CatalogItem = {
  id: string;
  name: string;
  pluralName: string;
  aliases: string[];
  unitCents: number;
};

export type Catalog = {
  currency: "usd";
  laborRateCents: number;
  daysUntilDue: number;
  customers: CatalogCustomer[];
  items: CatalogItem[];
};

export function demoCatalog(env: Record<string, string | undefined> = process.env): Catalog {
  return {
    currency: "usd",
    laborRateCents: 12000,
    daysUntilDue: 7,
    customers: [
      {
        id: "juniper-cafe",
        name: "Juniper Cafe",
        aliases: ["juniper cafe", "juniper"],
        // Set in .env.local. Stripe test mode never emails it, but Stripe needs a real address.
        recipient: env.INVOICE_TEST_RECIPIENT?.trim() || null,
      },
    ],
    items: [
      {
        id: "shutoff-valve",
        name: "Shutoff valve",
        pluralName: "Shutoff valves",
        aliases: ["shutoff valve", "shut off valve", "shut-off valve", "valve"],
        unitCents: 2250,
      },
    ],
  };
}
