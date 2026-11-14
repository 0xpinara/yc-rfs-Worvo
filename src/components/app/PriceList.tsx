"use client";

import { useState } from "react";
import type { Catalog } from "@/server/invoices/catalog";
import styles from "./App.module.css";
import { money } from "./format";
import { SAMPLE_BOOK, type PriceEntry } from "./sample-book";

type Book = {
  id: string;
  label: string;
  name: string;
  meta: string;
  live: boolean;
  labor: PriceEntry | null;
  services: PriceEntry[];
  parts: PriceEntry[];
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
    parts: catalog.items.map((entry) => ({ name: entry.name, cents: entry.unitCents, per: "each" })),
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

function PriceRows({ entries }: { entries: PriceEntry[] }) {
  return (
    <ul className={styles.priceRows}>
      {entries.map((entry) => (
        <li key={entry.name}>
          <span>{entry.name}</span>
          <span className={styles.priceValue}>
            {money(entry.cents)}
            <span className={styles.per}> / {entry.per}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Every invoice is priced from one saved list: yours (live), or an example business's. */
export function PriceList({ catalog }: { catalog: Catalog }) {
  const books = [liveBook(catalog), ...SAMPLE_BOOKS];
  const [selected, setSelected] = useState("live");
  const book = books.find((candidate) => candidate.id === selected) ?? books[0];
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
            onClick={() => setSelected(candidate.id)}
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
        <span className={styles.chip} data-tone={book.live ? "paid" : "neutral"}>
          {book.live ? "Live" : "Example"}
        </span>
      </div>

      <div className={styles.priceGrid} key={`${book.id}-grid`}>
        {headline ? (
          <section className={`${styles.card} ${styles.rateCard}`} aria-label={book.labor ? "Labor rate" : "Most booked"}>
            <h3 className={styles.cardTitle}>{book.labor ? book.labor.name : "Most booked"}</h3>
            {!book.labor ? <p className={styles.rateName}>{headline.name}</p> : null}
            <p className={styles.rate}>
              {money(headline.cents)}
              <span>per {headline.per}</span>
            </p>
            <p className={styles.cardNote}>{terms}</p>
          </section>
        ) : null}

        {book.services.length > 0 ? (
          <section className={styles.card} aria-label="Services">
            <h3 className={styles.cardTitle}>Services</h3>
            <PriceRows entries={book.services} />
          </section>
        ) : null}

        {book.parts.length > 0 ? (
          <section className={styles.card} aria-label="Parts and materials">
            <h3 className={styles.cardTitle}>{book.live ? "Parts" : "Parts & materials"}</h3>
            <PriceRows entries={book.parts} />
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
      </div>

      {!book.live ? <p className={styles.sampleNote}>Example price list. Synthetic data for the demo; live invoices use Your prices.</p> : null}
    </div>
  );
}
