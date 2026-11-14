import Link from "next/link";
import styles from "./Landing.module.css";
import { EarlyAccessForm } from "./EarlyAccessForm";
import { HeroDemo } from "./HeroDemo";
import { archivo, newsreader } from "./fonts";
import { WorvoMark } from "./icons";
import { TallyHero, TallySteps } from "./Tally";
import fx from "@/components/fx/Fx.module.css";

export function LandingPage() {
  return (
    <div id="top" className={`${styles.page} ${archivo.variable} ${newsreader.variable}`}>
      <div className={styles.heroWrap}>
        <section className={`${styles.hero} ${styles.onDark}`} aria-label="Introduction">
          <div className={styles.ripples} aria-hidden="true">
            <svg viewBox="0 0 760 760">
              <circle cx="380" cy="380" r="110" />
              <circle cx="380" cy="380" r="190" />
              <circle cx="380" cy="380" r="270" />
              <circle cx="380" cy="380" r="350" />
            </svg>
          </div>
          <div className={styles.container}>
            <header className={styles.header}>
              <a href="#top" aria-label="Worvo home" className={styles.brand}>
                <WorvoMark />
                <span>worvo</span>
              </a>
              <nav aria-label="Main" className={styles.nav}>
                <a href="#how" className={styles.navLink}>
                  How it works
                </a>
                <Link href="/app" className={styles.navLink}>
                  Open app
                </Link>
                <a href="#access" className={`${styles.navCta} ${fx.fx}`}>
                  Get early access
                </a>
              </nav>
            </header>

            <div className={styles.heroBody}>
              <div className={styles.heroText}>
                <h1 className={styles.h1}>
                  <span>Say it.</span>
                  <span>Send the invoice.</span>
                </h1>
                <p className={styles.lede}>Record the job on your wristband. Worvo writes the invoice.</p>
                <div className={styles.heroCtas}>
                  <a href="#demo" className={`${styles.ctaPrimary} ${fx.fx}`}>
                    Try it
                  </a>
                  <a href="#access" className={`${styles.ctaGhost} ${fx.fx}`}>
                    Get early access
                  </a>
                </div>
              </div>
              <TallyHero />
            </div>

            <div id="demo" className={styles.demoAnchor}>
              <HeroDemo />
            </div>
          </div>
        </section>
      </div>

      <TallySteps />

      <div className={styles.accessWrap}>
        <section id="access" aria-labelledby="access-title" className={`${styles.access} ${styles.onDark}`}>
          <div className={styles.accessInner}>
            <div className={styles.accessCopy}>
              <h2 id="access-title" className={styles.accessTitle}>
                Be first to try Worvo.
              </h2>
              <p className={styles.accessText}>For service businesses that invoice by hand.</p>
            </div>
            <div className={styles.formSlot}>
              <EarlyAccessForm />
            </div>
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerBrand}>
            <WorvoMark size={20} tone="dark" />
            <span>worvo</span>
          </span>
          <span>Invoices sent and paid through Stripe.</span>
          <span>© 2026 Worvo</span>
        </div>
      </footer>
    </div>
  );
}
