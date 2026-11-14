import type { Metadata } from "next";
import type { ReactNode } from "react";
import { FxController } from "@/components/fx/FxController";
import "./globals.css";

export const metadata: Metadata = { title: "Worvo", description: "Voice-to-invoice for service businesses." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}<FxController /></body></html>;
}
