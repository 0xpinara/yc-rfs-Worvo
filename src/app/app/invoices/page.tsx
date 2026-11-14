import type { Metadata } from "next";
import { InvoiceList } from "@/components/app/InvoiceList";

export const metadata: Metadata = { title: "Invoices" };

export default function InvoicesPage() {
  return <InvoiceList />;
}
