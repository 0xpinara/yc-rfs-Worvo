// Script for the landing page's animated sample invoice. Marketing content only:
// it never touches the invoice API. Amounts match docs/DEMO.md ($120/h, $22.50 valves).

export type ScenarioKey = "ready" | "held";
export type PartKey = "customer" | "service" | "labor" | "valves" | "email" | "parts";

type Segment = readonly [text: string, part: PartKey | null];

export type DemoLineContent = { name: string; detail: string; cents: number };

export type DemoLine = DemoLineContent & {
  id: PartKey;
  quote: string;
  /** Present when the spoken line is ambiguous; shown after the worker answers the question. */
  fix?: DemoLineContent & { note: string };
};

export type DemoJob = {
  segments: readonly Segment[];
  service: string;
  /** Which spoken phrase reveals the "Saved billing email" line. */
  emailFrom: PartKey;
  lines: readonly DemoLine[];
};

export type DemoWord = { text: string; part: PartKey | null };

export const DEMO_JOBS: Record<ScenarioKey, DemoJob> = {
  ready: {
    segments: [
      ["Worvo, invoice ", null],
      ["Juniper Cafe", "customer"],
      [" for today’s ", null],
      ["sink repair", "service"],
      [". ", null],
      ["Ninety minutes of labor at my usual rate", "labor"],
      [" and ", null],
      ["two shutoff valves at the standard price", "valves"],
      [". Send it to their ", null],
      ["saved billing email", "email"],
      [".", null],
    ],
    service: "Sink repair",
    emailFrom: "email",
    lines: [
      { id: "labor", name: "Labor", detail: "90 min at $120.00 per hour", cents: 18000, quote: "Ninety minutes of labor at my usual rate" },
      { id: "valves", name: "Shutoff valve", detail: "2 at $22.50 each", cents: 4500, quote: "two shutoff valves at the standard price" },
    ],
  },
  held: {
    segments: [
      ["Worvo, invoice ", null],
      ["Juniper Cafe", "customer"],
      [" for this morning’s ", null],
      ["drain clearing", "service"],
      [". ", null],
      ["One hour at my usual rate", "labor"],
      [", plus ", null],
      ["forty-five dollars in parts", "parts"],
      [".", null],
    ],
    service: "Drain clearing",
    emailFrom: "customer",
    lines: [
      { id: "labor", name: "Labor", detail: "60 min at $120.00 per hour", cents: 12000, quote: "One hour at my usual rate" },
      {
        id: "parts",
        name: "Parts",
        detail: "Not itemized yet",
        cents: 0,
        quote: "forty-five dollars in parts",
        fix: { name: "Shutoff valve", detail: "2 at $22.50 each", cents: 4500, note: "Itemized from your phone" },
      },
    ],
  },
};

/** Splits each spoken segment into words, keeping the surrounding spaces on each word. */
export function splitWords(job: DemoJob): DemoWord[] {
  const out: DemoWord[] = [];
  for (const [text, part] of job.segments) {
    for (const word of text.match(/\s*\S+\s*/g) ?? [text]) out.push({ text: word, part });
  }
  return out;
}

/** Milliseconds after start at which each word is "heard", paced like natural speech. */
export function wordTimings(words: readonly DemoWord[]): number[] {
  const times: number[] = [];
  let t = 400;
  for (const word of words) {
    times.push(t);
    const s = word.text.trim();
    t += /[A-Za-z0-9]/.test(s) ? 170 : 40;
    if (/,$/.test(s)) t += 240;
    if (/\.$/.test(s)) t += 460;
  }
  return times;
}

/** For each phrase, how many words must be heard before it counts as recognized. */
export function partEnds(words: readonly DemoWord[]): Partial<Record<PartKey, number>> {
  const ends: Partial<Record<PartKey, number>> = {};
  words.forEach((word, i) => {
    if (word.part) ends[word.part] = i + 1;
  });
  return ends;
}

export function demoTotalCents(job: DemoJob, answered: boolean): number {
  return job.lines.reduce((sum, line) => sum + (line.fix ? (answered ? line.fix.cents : 0) : line.cents), 0);
}

export function formatCents(cents: number): string {
  const dollars = Math.floor(cents / 100);
  const rest = String(cents % 100).padStart(2, "0");
  return `$${dollars.toLocaleString("en-US")}.${rest}`;
}

export const DEMO_WORDS: Record<ScenarioKey, DemoWord[]> = {
  ready: splitWords(DEMO_JOBS.ready),
  held: splitWords(DEMO_JOBS.held),
};

export const DEMO_TIMES: Record<ScenarioKey, number[]> = {
  ready: wordTimings(DEMO_WORDS.ready),
  held: wordTimings(DEMO_WORDS.held),
};

export const DEMO_ENDS: Record<ScenarioKey, Partial<Record<PartKey, number>>> = {
  ready: partEnds(DEMO_WORDS.ready),
  held: partEnds(DEMO_WORDS.held),
};
