import type { Metadata } from "next";
import { CaptureScreen } from "@/components/app/CaptureScreen";

export const metadata: Metadata = { title: "Record" };

/** Companion record UI → captures + draft + send (Person A backend). */
export default function RecordPage() {
  return <CaptureScreen />;
}
