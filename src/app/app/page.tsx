import type { Metadata } from "next";
import { CaptureScreen } from "@/components/app/CaptureScreen";

export const metadata: Metadata = { title: "Record" };

export default function RecordPage() {
  return <CaptureScreen />;
}
