"use client";

import { useState, type FormEvent } from "react";
import fx from "@/components/fx/Fx.module.css";
import type { Catalog } from "@/server/invoices/catalog";
import styles from "./App.module.css";
import { money } from "./format";
import { SAMPLE_BOOK, type PriceEntry } from "./sample-book";

type Entry = PriceEntry & { id?: string };

type Book = {
  id: string;
  label: string;
  name: string;
  meta: string;
  live: boolean;
  labor: Entry | null;
  services: Entry[];
  parts: Entry[];
  customers: { name: string; email: string | null }[];
  daysUntilDue: number;
};

function liveBook(catalog: Catalog): Book {
  return {
    id: "live",
    label: "Your prices",
    name: "Your business",
    meta: "Used to price every live invoice",
    live: true,
    labor: { name: "Labor", cents: catalog.laborRateCents, per: "hour" },
    services: [],
    parts: catalog.items.map((entry) => ({ name: entry.name, cents: entry.unitCents, per: "each", id: entry.id })),
    customers: catalog.customers.map((customer) => ({ name: customer.name, email: customer.recipient })),
    daysUntilDue: catalog.daysUntilDue,
  };
}

const SAMPLE_BOOKS: Book[] = SAMPLE_BOOK.map((business) => ({
  id: business.id,
  label: business.trade,
  name: business.name,
  meta: `${business.city} · ${business.owner}`,
  live: false,
  labor: business.labor,
  services: business.services,
  parts: business.parts,
  customers: business.customers,
  daysUntilDue: business.daysUntilDue,
}));

const toDollars = (cents: number) => (cents / 100).toFixed(2);

function PriceRows({ entries, editing, draft, onChange }: {
  entries: Entry[];
  editing: boolean;
  draft: Record<string, string>;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <ul className={styles.priceRows}>
      {entries.map((entry) => (
        <li key={entry.name}>
          <span>{entry.name}</span>
          {editing ? (
            <label className={styles.priceInput}>
              <span aria-hidden="true">$</span>
              <input
                inputMode="decimal"
                aria-label={`${entry.name} price in dollars`}
                value={draft[entry.name] ?? toDollars(entry.cents)}
                onChange={(event) => onChange(entry.name, event.target.value)}
              />
              <span className={styles.per}>/ {entry.per}</span>
            </label>
          ) : (
            <span className={styles.priceValue}>
              {money(entry.cents)}
              <span className={styles.per}> / {entry.per}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

const LABOR = "__labor";

/** "$1,234.5" → 123450 cents, or null when it isn't a price between $0.01 and $100,000. */
function parseCents(text: string): number | null {
  const clean = text.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const cents = Math.round(Number(clean) * 100);
  return cents >= 1 && cents <= 10_000_000 ? cents : null;
}

function withEdits(book: Book, edits: Record<string, number> | undefined): Book {
  if (!edits) return book;
  const apply = (entry: Entry) => ({ ...entry, cents: edits[entry.name] ?? entry.cents });
  return {
    ...book,
    labor: book.labor ? { ...book.labor, cents: edits[LABOR] ?? book.labor.cents } : null,
    services: book.services.map(apply),
    parts: book.parts.map(apply),
  };
}

/** Every invoice is priced from one saved list: yours (live), or an example business's. */
export function PriceList({ catalog }: { catalog: Catalog }) {
  const [live, setLive] = useState(catalog);
  const [sampleEdits, setSampleEdits] = useState<Record<string, Record<string, number>>>({});
  const [selected, setSelected] = useState("live");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const books = [liveBook(live), ...SAMPLE_BOOKS.map((sample) => withEdits(sample, sampleEdits[sample.id]))];
  const book = books.find((candidate) => candidate.id === selected) ?? books[0];

  const choose = (id: string) => {
    setSelected(id);
    setEditing(false);
    setDraft({});
    setMessage(null);
  };

  const startEditing = () => {
    setDraft({});
    setMessage(null);
    setEditing(true);
  };

  async function save(event: FormEvent) {
    event.preventDefault();
    const changed: Record<string, number> = {};
    for (const [name, text] of Object.entries(draft)) {
      const cents = parseCents(text);
      if (cents === null) {
        setMessage({ tone: "error", text: `“${text}” isn’t a price. Use a number like 22.50.` });
        return;
      }
      changed[name] = cents;
    }
    if (Object.keys(changed).length === 0) {
      setEditing(false);
      return;
    }
    if (!book.live) {
      setSampleEdits((all) => ({ ...all, [book.id]: { ...all[book.id], ...changed } }));
      setEditing(false);
      setMessage({ tone: "ok", text: "Saved in this browser tab (example business)." });
      return;
    }
    setSaving(true);
    try {
      const items = book.parts
        .filter((entry) => entry.id && changed[entry.name] !== undefined)
        .map((entry) => ({ id: entry.id as string, unitCents: changed[entry.name] }));
      const response = await fetch("/api/setup/prices", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...(changed[LABOR] !== undefined ? { laborRateCents: changed[LABOR] } : {}), items }),
      });
      const body = (await response.json()) as { ok: true; data: { catalog: Catalog } } | { ok: false; error: { message: string } };
      if (!body.ok) throw new Error(body.error.message);
      setLive(body.data.catalog);
      setEditing(false);
      setMessage({ tone: "ok", text: "Saved. New invoices use these prices." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Couldn’t save prices." });
    } finally {
      setSaving(false);
    }
  }

  const edit = (name: string, value: string) => setDraft((current) => ({ ...current, [name]: value }));
  const headline = book.labor ?? book.services[0] ?? null;
  const terms = book.daysUntilDue === 0 ? "Due on receipt." : `Payment due in ${book.daysUntilDue} days.`;

  return (
    <div className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Prices.</h1>
          <p className={styles.pageLead}>Every invoice is priced from a saved list. The AI never sets a price.</p>
        </div>
      </div>

      <div className={styles.filters} role="group" aria-label="Choose a price list">
        {books.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            className={styles.filter}
            aria-pressed={candidate.id === book.id}
            onClick={() => choose(candidate.id)}
          >
            {candidate.live ? <span className={styles.liveDot} aria-hidden="true" /> : null}
            {candidate.label}
          </button>
        ))}
      </div>

      <div className={styles.bookHead} key={book.id}>
        <div>
          <h2 className={styles.bookName}>{book.name}</h2>
          <p className={styles.bookMeta}>{book.meta}</p>
        </div>
        <div className={styles.bookActions}>
          <span className={styles.chip} data-tone={book.live ? "paid" : "neutral"}>
            {book.live ? "Live" : "Example"}
          </span>
          {editing ? (
            <>
              <button type="button" className={styles.ghostBtn} onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </button>
              <button type="submit" form="price-form" className={`${styles.saveBtn} ${fx.fx}`} disabled={saving}>
                {saving ? "Saving…" : "Save prices"}
              </button>
            </>
          ) : (
            <button type="button" className={`${styles.saveBtn} ${fx.fx}`} onClick={startEditing}>
              Edit prices
            </button>
          )}
        </div>
      </div>

      {message ? (
        <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? styles.alertLight : styles.savedNote}>
          {message.text}
        </p>
      ) : null}

      <form id="price-form" className={styles.priceGrid} key={`${book.id}-grid`} onSubmit={save}>
        {headline ? (
          <section className={`${styles.card} ${styles.rateCard}`} aria-label={book.labor ? "Labor rate" : "Most booked"}>
            <h3 className={styles.cardTitle}>{book.labor ? book.labor.name : "Most booked"}</h3>
            {!book.labor ? <p className={styles.rateName}>{headline.name}</p> : null}
            {editing ? (
              <label className={`${styles.priceInput} ${styles.rateInput}`}>
                <span aria-hidden="true">$</span>
                <input
                  inputMode="decimal"
                  aria-label={`${book.labor ? "Labor rate" : headline.name} in dollars`}
                  value={draft[book.labor ? LABOR : headline.name] ?? toDollars(headline.cents)}
                  onChange={(event) => edit(book.labor ? LABOR : headline.name, event.target.value)}
                />
                <span>per {headline.per}</span>
              </label>
            ) : (
              <p className={styles.rate}>
                {money(headline.cents)}
                <span>per {headline.per}</span>
              </p>
            )}
            <p className={styles.cardNote}>{terms}</p>
          </section>
        ) : null}

        {book.services.length > 0 ? (
          <section className={styles.card} aria-label="Services">
            <h3 className={styles.cardTitle}>Services</h3>
            <PriceRows entries={book.services} editing={editing} draft={draft} onChange={edit} />
          </section>
        ) : null}

        {book.parts.length > 0 ? (
          <section className={styles.card} aria-label="Parts and materials">
            <h3 className={styles.cardTitle}>{book.live ? "Parts" : "Parts & materials"}</h3>
            <PriceRows entries={book.parts} editing={editing} draft={draft} onChange={edit} />
          </section>
        ) : null}

        <section className={styles.card} aria-label="Customers">
          <h3 className={styles.cardTitle}>Customers</h3>
          <ul className={styles.priceRows}>
            {book.customers.map((customer) => (
              <li key={customer.name}>
                <span>{customer.name}</span>
                <span className={customer.email ? styles.priceSub : styles.missing}>
                  {customer.email ?? "Billing email missing"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </form>

      {!book.live ? <p className={styles.sampleNote}>Example price list. Synthetic data for the demo; live invoices use Your prices.</p> : null}
    </div>
  );
}
