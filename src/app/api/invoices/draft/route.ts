import { DraftRequestSchema } from "@/shared/contracts";
import { extractProposal } from "@/server/extraction";
import { savedCatalog } from "@/server/invoices/saved-prices";
import { InvoiceError } from "@/server/invoices/errors";
import { fail, ok } from "@/server/invoices/http";
import { invoiceStore } from "@/server/invoices/store";

// Body: { transcript, source, sourceId?, sessionId?, capturedAt? } -> { invoice }
export async function POST(request: Request) {
  const parsed = DraftRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join("."));
    return fail(new InvoiceError("invalid_input", "Expected { transcript, source }", fields));
  }
  try {
    const invoice = await invoiceStore().draft(parsed.data, extractProposal, savedCatalog());
    return ok({ invoice }, 201);
  } catch (error) {
    return fail(error);
  }
}
