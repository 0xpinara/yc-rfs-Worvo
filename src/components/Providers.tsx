"use client";

import type { ReactNode } from "react";
import { BandProvider } from "@/components/app/BandProvider";

/** Client providers that must wrap the whole SPA (band stays up across routes). */
export function Providers({ children }: { children: ReactNode }) {
  return <BandProvider>{children}</BandProvider>;
}
