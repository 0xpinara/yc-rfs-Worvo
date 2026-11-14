import assert from "node:assert/strict";
import test from "node:test";
import { invoiceCents, lineCents, SAMPLE_BOOK } from "../src/components/app/sample-book";

test("sample book covers many kinds of service work", () => {
  const trades = new Set(SAMPLE_BOOK.map((business) => business.trade));
  assert.equal(trades.size, SAMPLE_BOOK.length, "one business per trade");
  assert.ok(trades.size >= 20, `expected 20+ trades, got ${trades.size}`);
  for (const trade of ["Plumbing", "Auto repair", "Mobile mechanic", "Dog walking", "Handyman", "House cleaning"]) {
    assert.ok(trades.has(trade), `missing ${trade}`);
  }
});

test("every sample line is priced from that business's own price list", () => {
  for (const business of SAMPLE_BOOK) {
    const listed = new Map([...business.services, ...business.parts].map((entry) => [entry.name, entry.cents]));
    for (const invoice of business.invoices) {
      assert.ok(invoice.lines.length > 0, `${invoice.number} has no lines`);
      for (const line of invoice.lines) {
        assert.ok(Number.isInteger(line.quantity) && line.quantity > 0, `${invoice.number}: bad quantity`);
        if (line.unit === "minute") {
          assert.ok(business.labor, `${invoice.number}: labor line but ${business.name} bills no hourly rate`);
          assert.equal(line.description, business.labor.name, `${invoice.number}: labor name`);
          assert.equal(line.rateCents, business.labor.cents, `${invoice.number}: labor rate`);
        } else {
          assert.equal(listed.get(line.description), line.rateCents, `${invoice.number}: ${line.description} not on the price list`);
        }
      }
    }
  }
});

test("sample invoices have known customers, unique numbers, real dates and statuses that fit", () => {
  const numbers = new Set<string>();
  for (const business of SAMPLE_BOOK) {
    const customers = new Set(business.customers.map((customer) => customer.name));
    for (const invoice of business.invoices) {
      assert.ok(!numbers.has(invoice.number), `duplicate ${invoice.number}`);
      numbers.add(invoice.number);
      assert.ok(customers.has(invoice.customer), `${invoice.number}: unknown customer ${invoice.customer}`);
      assert.match(invoice.date, /^2026-(10|11)-\d{2}$/);
      assert.ok(!Number.isNaN(Date.parse(`${invoice.date}T12:00:00Z`)));
      assert.ok(invoice.date <= "2026-11-14", `${invoice.number} is dated in the future`);
      assert.ok(invoice.said.length > 20, `${invoice.number}: missing what was said`);
      assert.equal(Boolean(invoice.question), invoice.status === "question", `${invoice.number}: question/status mismatch`);
    }
  }
});

test("sample customer emails only use reserved example domains", () => {
  for (const business of SAMPLE_BOOK) {
    for (const customer of business.customers) {
      assert.match(customer.email, /@([a-z0-9-]+\.)?example\.(com|org|net)$/, customer.email);
    }
  }
});

test("sample amounts use the server's labor rounding and integer cents", () => {
  assert.equal(lineCents({ description: "Labor", quantity: 40, unit: "minute", rateCents: 14500 }), 9667);
  assert.equal(lineCents({ description: "Labor", quantity: 90, unit: "minute", rateCents: 13500 }), 20250);
  assert.equal(lineCents({ description: "Key copy", quantity: 12, unit: "each", rateCents: 450 }), 5400);
  for (const business of SAMPLE_BOOK) {
    for (const invoice of business.invoices) {
      const total = invoiceCents(invoice);
      assert.ok(Number.isInteger(total) && total > 0, `${invoice.number}: bad total`);
      assert.ok(total < 200_000, `${invoice.number}: $${total / 100} looks unrealistic`);
    }
  }
});
