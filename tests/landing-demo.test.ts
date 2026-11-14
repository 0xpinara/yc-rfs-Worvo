import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_INVOICE, DEMO_TRANSCRIPT } from "../src/fixtures/invoice";
import {
  DEMO_ENDS,
  DEMO_JOBS,
  DEMO_WORDS,
  demoTotalCents,
  formatCents,
} from "../src/components/landing/demo-script";

test("landing sample invoice shows the same $225 total as the shared demo fixture", () => {
  assert.equal(demoTotalCents(DEMO_JOBS.ready, false), DEMO_INVOICE.totalCents);
  assert.equal(formatCents(DEMO_INVOICE.totalCents), "$225.00");
});

test("landing sample speaks the canonical demo sentence", () => {
  const spoken = DEMO_WORDS.ready.map((word) => word.text).join("");
  assert.equal(spoken.replaceAll("’", "'"), DEMO_TRANSCRIPT);
});

test("unclear parts stay out of the landing total until the question is answered", () => {
  assert.equal(demoTotalCents(DEMO_JOBS.held, false), 12000);
  assert.equal(demoTotalCents(DEMO_JOBS.held, true), 16500);
});

test("every invoice line in the landing sample is tied to a spoken phrase", () => {
  for (const key of ["ready", "held"] as const) {
    const job = DEMO_JOBS[key];
    assert.equal(
      DEMO_WORDS[key].map((word) => word.text).join(""),
      job.segments.map(([text]) => text).join(""),
    );
    for (const line of job.lines) assert.ok(DEMO_ENDS[key][line.id], `${key}: ${line.id} is never spoken`);
  }
});

test("formatCents uses whole cents with thousands separators", () => {
  assert.equal(formatCents(0), "$0.00");
  assert.equal(formatCents(4500), "$45.00");
  assert.equal(formatCents(123456), "$1,234.56");
});
