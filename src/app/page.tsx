import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Worvo: say it, send the invoice",
  description:
    "Record the job on your wristband. Worvo writes the invoice from your prices, ready to send through Stripe.",
};

export default function Home() {
  return <LandingPage />;
}
