"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { archivo, newsreader } from "@/components/landing/fonts";
import { WorvoMark } from "@/components/landing/icons";
import { useBand } from "./BandProvider";
import styles from "./App.module.css";
import fx from "@/components/fx/Fx.module.css";

const TABS = [
  { href: "/capture", label: "Record" },
  { href: "/app/invoices", label: "Invoices" },
  { href: "/app/prices", label: "Prices" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const band = useBand();
  const bandLive = band.status === "connected" || band.status === "recording";

  return (
    <div className={`${styles.app} ${archivo.variable} ${newsreader.variable}`}>
      <header className={styles.bar}>
        <Link href="/" className={styles.brand} aria-label="Worvo home">
          <WorvoMark size={24} tone="dark" />
          <span>worvo</span>
        </Link>
        <nav aria-label="App" className={styles.tabs}>
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${styles.tab} ${fx.fx} ${fx.quiet} ${fx.light}`}
              aria-current={pathname === tab.href || (tab.href === "/capture" && pathname === "/app") ? "page" : undefined}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        {bandLive ? (
          <span className={styles.bandChip} title="Band stays connected while you move around this tab">
            Band linked
          </span>
        ) : null}
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
