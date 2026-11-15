"use client";

import { AppShell } from "@/components/app/AppShell";
import { CaptureScreen } from "@/components/app/CaptureScreen";

/**
 * Same record experience as /app: band / phone / typed → Deepgram capture →
 * Gemini draft → Stripe send → QR → paid, with band LED + double-tap.
 */
export default function CapturePage() {
  return (
    <AppShell>
      <CaptureScreen />
    </AppShell>
  );
}
