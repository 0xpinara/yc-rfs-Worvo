import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import { FxController } from "@/components/fx/FxController";
import "./globals.css";

export const metadata: Metadata = { title: "Worvo", description: "Voice-to-invoice for service businesses." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <FxController />
        </Providers>
      </body>
    </html>
  );
}
