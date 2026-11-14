import type { Metadata } from "next";
import { InvoiceScreen } from "@/components/invoices/InvoiceScreen";

export const metadata: Metadata = { title: "Worvo demo" };

export default function DemoPage() {
  return <InvoiceScreen />;
}
