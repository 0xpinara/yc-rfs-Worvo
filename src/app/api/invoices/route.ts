import { ok } from "@/server/invoices/http";
import { invoiceStore } from "@/server/invoices/store";

export const dynamic = "force-dynamic";

export function GET() {
  return ok({ invoices: invoiceStore().list() });
}
