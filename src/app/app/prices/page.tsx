import type { Metadata } from "next";
import { PriceList } from "@/components/app/PriceList";
import { demoCatalog } from "@/server/invoices/catalog";

export const metadata: Metadata = { title: "Prices" };
// The billing email comes from .env.local, so read the catalog per request.
export const dynamic = "force-dynamic";

export default function PricesPage() {
  return <PriceList catalog={demoCatalog()} />;
}
