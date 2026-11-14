import type { Catalog } from "@/server/invoices/catalog";
import styles from "./App.module.css";
import { money } from "./format";

/** The saved setup every invoice is priced from. Read-only for the demo. */
export function PriceList({ catalog }: { catalog: Catalog }) {
  return (
    <div className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Your prices.</h1>
          <p className={styles.pageLead}>Every invoice is priced from this list. The AI never sets a price.</p>
        </div>
      </div>

      <div className={styles.priceGrid}>
        <section className={`${styles.card} ${styles.rateCard}`} aria-labelledby="labor-title">
          <h2 id="labor-title" className={styles.cardTitle}>
            Labor
          </h2>
          <p className={styles.rate}>
            {money(catalog.laborRateCents)}
            <span>per hour</span>
          </p>
          <p className={styles.cardNote}>Payment due in {catalog.daysUntilDue} days.</p>
        </section>

        <section className={styles.card} aria-labelledby="parts-title">
          <h2 id="parts-title" className={styles.cardTitle}>
            Parts
          </h2>
          <ul className={styles.priceRows}>
            {catalog.items.map((item) => (
              <li key={item.id}>
                <span>{item.name}</span>
                <span className={styles.priceValue}>{money(item.unitCents)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.card} aria-labelledby="customers-title">
          <h2 id="customers-title" className={styles.cardTitle}>
            Customers
          </h2>
          <ul className={styles.priceRows}>
            {catalog.customers.map((customer) => (
              <li key={customer.id}>
                <span>{customer.name}</span>
                <span className={customer.recipient ? styles.priceSub : styles.missing}>
                  {customer.recipient ?? "Billing email missing"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
