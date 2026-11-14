import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";

export const metadata: Metadata = {
  title: { default: "Worvo", template: "%s · Worvo" },
  description: "Record the job on your wristband. Worvo writes the invoice.",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
