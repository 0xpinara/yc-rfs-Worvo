import styles from "./Landing.module.css";
import { EarlyAccessForm } from "./EarlyAccessForm";
import { HeroDemo } from "./HeroDemo";
import { archivo, newsreader } from "./fonts";
import { WorvoMark } from "./icons";
import { MeetTally, TallyHero } from "./Tally";

const STEPS = [
  {
    title: "Set up once",
    body: "From your phone or browser, connect Stripe, add your customers, and save your hourly rates and prices.",
  },
  {
    title: "Record what you did",
    body: "Leaving the job, record who it’s for, how long it took, and what you used. No laptop and no forms.",
  },
  {
    title: "Confirm and get paid",
    body: "Check the draft and confirm with a tap. Stripe emails the invoice with a payment page, and you’ll see when it’s paid.",
  },
];

const PROMISES = [
  {
    title: "It asks when something’s unclear",
    body: "If it can’t tell who the customer is, how long you worked, or what something costs, Worvo holds the draft and asks you one clear question.",
  },
  {
    title: "Your prices, to the cent",
    body: "The AI only picks out what you said. Every amount comes from your saved rates and prices, worked out exactly.",
  },
  {
    title: "Nothing goes out without you",
    body: "You approve the exact invoice and who it goes to. Change a line and it needs your OK again.",
  },
];

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
                <a href="#access" className={styles.navCta}>
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
                <p className={styles.lede}>
                  Record the job on your wristband. Worvo writes the invoice from your prices, ready to send through
                  Stripe.
                </p>
                <div className={styles.heroForm}>
                  <EarlyAccessForm />
                </div>
              </div>
              <TallyHero />
            </div>

            <HeroDemo />
          </div>
        </section>
      </div>

      <section id="how" aria-labelledby="how-title" className={styles.how}>
        <div className={styles.inner}>
          <h2 id="how-title" className={`${styles.h2} ${styles.howTitle}`}>
            Set it up once. Then just talk.
          </h2>
          <ol className={styles.steps}>
            {STEPS.map((step, i) => (
              <li key={step.title} className={styles.step}>
                <div className={styles.stepHead} aria-hidden="true">
                  <span className={styles.stepNum}>{i + 1}</span>
                  <span className={styles.stepRule} />
                </div>
                <h3 className={`${styles.h3} ${styles.stepTitle}`}>{step.title}</h3>
                <p className={`${styles.body} ${styles.stepBody}`}>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <MeetTally />

      <div className={styles.trustWrap}>
        <section aria-labelledby="trust-title" className={styles.trust}>
          <div className={styles.trustInner}>
            <h2 id="trust-title" className={`${styles.h2} ${styles.trustTitle}`}>
              It never guesses about money.
            </h2>
            <div className={styles.trustList}>
              {PROMISES.map((promise) => (
                <div key={promise.title}>
                  <h3 className={styles.h3}>{promise.title}</h3>
                  <p className={`${styles.body} ${styles.trustBody}`}>{promise.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className={styles.accessWrap}>
        <section id="access" aria-labelledby="access-title" className={`${styles.access} ${styles.onDark}`}>
          <div className={styles.accessInner}>
            <div className={styles.accessCopy}>
              <h2 id="access-title" className={styles.accessTitle}>
                Be first to try Worvo.
              </h2>
              <p className={styles.accessText}>
                We’re building Worvo now for independent service businesses that already have their own customers.
                Leave your email and we’ll write when early access opens.
              </p>
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
          <span>Invoices are sent and paid through Stripe.</span>
          <span>© 2026 Worvo</span>
        </div>
      </footer>
    </div>
  );
}
