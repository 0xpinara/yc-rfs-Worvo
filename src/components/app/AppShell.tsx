"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { archivo, newsreader } from "@/components/landing/fonts";
import { WorvoMark } from "@/components/landing/icons";
import styles from "./App.module.css";
import fx from "@/components/fx/Fx.module.css";

const TABS = [
  { href: "/app", label: "Record" },
  { href: "/app/invoices", label: "Invoices" },
  { href: "/app/prices", label: "Prices" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className={`${styles.app} ${archivo.variable} ${newsreader.variable}`}>
      <header className={styles.bar}>
        <Link href="/" className={styles.brand} aria-label="Worvo home">
          <WorvoMark size={24} tone="dark" />
          <span>worvo</span>
        </Link>
        <nav aria-label="App" className={styles.tabs}>
          {TABS.map((tab) => (
            <Link key={tab.href} href={tab.href} className={`${styles.tab} ${fx.fx} ${fx.quiet} ${fx.light}`} aria-current={pathname === tab.href ? "page" : undefined}>
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
