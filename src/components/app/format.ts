import type { DraftRequest, InvoiceView, Capture } from "@/shared/contracts";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export const money = (cents: number) => usd.format(cents / 100);

export function lineDetail(line: InvoiceView["lines"][number]): string {
  return line.unit === "minute"
    ? `${line.quantity} min at ${money(line.rateCents)} per hour`
    : `${line.quantity} at ${money(line.rateCents)} each`;
}

const QUESTION: Record<string, string> = {
  customer: "Who is this for?",
  recipient: "Their billing email",
  labor: "How long the job took",
  labor_minutes: "How long the job took",
  labor_rate: "Which labor rate to use",
  materials: "Which parts, and how many",
  parts_amount: "Which parts, and how many",
  material_quantity: "How many of each part",
  material_price: "The price of each part",
  lines: "What to bill for",
};

/** Turns the server's unresolved field names into short, human questions (deduplicated). */
export function questions(unresolved: readonly string[]): string[] {
  const mapped = unresolved.map((field) =>
    field.startsWith("price:") ? `A saved price for “${field.slice("price:".length)}”` : (QUESTION[field] ?? field),
  );
  return [...new Set(mapped)];
}

export type StatusTone = "neutral" | "question" | "ready" | "sent" | "paid" | "error";

export function invoiceStatus(invoice: InvoiceView): { label: string; tone: StatusTone } {
  if (invoice.paymentStatus === "paid") return { label: "Paid", tone: "paid" };
  if (invoice.sendStatus === "succeeded") return { label: "Sent", tone: "sent" };
  if (invoice.sendStatus === "pending" || invoice.sendStatus === "unknown") return { label: "Sending", tone: "ready" };
  if (invoice.sendStatus === "failed") return { label: "Send failed", tone: "error" };
  if (invoice.unresolved.length > 0) return { label: "Needs an answer", tone: "question" };
  return { label: "Ready to send", tone: "ready" };
}

type LineLike = { description: string; quantity: number; unit: "minute" | "each" };

/** 90 → "1 h 30 min", 45 → "45 min", 240 → "4 h". */
export function duration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** Short summary of an invoice's lines, e.g. "1 h 30 min labor · 2 × Shutoff valve". */
export function lineSummary(lines: readonly LineLike[]): string {
  if (lines.length === 0) return "No lines yet";
  return lines
    .map((line) =>
      line.unit === "minute"
        ? `${duration(line.quantity)} ${line.description.toLowerCase()}`
        : line.quantity === 1
          ? line.description
          : `${line.quantity} × ${line.description}`,
    )
    .join(" · ");
}

const shortDateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** "2026-11-13" → "Nov 13". */
export function shortDate(isoDate: string): string {
  return shortDateFormat.format(new Date(`${isoDate}T12:00:00Z`));
}

export function draftSource(source: Capture["source"]): DraftRequest["source"] {
  if (source === "vexo_memory") return "typed_text";
  return source;
}

/** Errors from the kit and recorder are sometimes plain objects; get a readable message either way. */
export function messageOf(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === "string" && message ? message : fallback;
}
