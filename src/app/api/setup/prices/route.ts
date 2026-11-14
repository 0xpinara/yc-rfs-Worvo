import { PriceUpdateSchema, savePrices, savedCatalog } from "@/server/invoices/saved-prices";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => Response.json(body, { status });

export function GET() {
  return json({ ok: true, data: { catalog: savedCatalog() } });
}

// Body: { laborRateCents?, items?: [{ id, unitCents }] } in whole cents -> { catalog }
export async function PUT(request: Request) {
  const parsed = PriceUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return json({ ok: false, error: { code: "invalid_input", message: "Prices must be whole cents between $0.01 and $100,000." } }, 422);
  }
  try {
    return json({ ok: true, data: { catalog: savePrices(parsed.data) } });
  } catch (error) {
    return json({ ok: false, error: { code: "invalid_input", message: error instanceof Error ? error.message : "Invalid prices." } }, 422);
  }
}
