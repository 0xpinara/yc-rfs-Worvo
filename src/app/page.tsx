import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Worvo: say it, send the invoice",
  description:
    "Built for solo plumbers. Tell your wristband what you did on the job, and Worvo writes the invoice from your own prices, ready to send through Stripe.",
};

export default function Home() {
  return <LandingPage />;
}
