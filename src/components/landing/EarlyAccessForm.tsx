"use client";

import { useId, useState, type FormEvent } from "react";
import styles from "./Landing.module.css";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Early-access sign-up from the design.
 * TODO(before sharing publicly): this only validates the address. Nothing is stored or sent yet,
 * so connect it to real storage before telling visitors they are on a list.
 */
export function EarlyAccessForm() {
  const id = useId();
  const inputId = `${id}-email`;
  const errorId = `${id}-error`;
  const [email, setEmail] = useState("");
  const [error, setError] = useState(false);
  const [joined, setJoined] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (EMAIL.test(email.trim())) {
      setJoined(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (joined) {
    return (
      <p role="status" className={styles.joined}>
        You’re on the list. We’ll email you when early access opens.
      </p>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <label htmlFor={inputId} className={styles.formLabel}>
        Your email
      </label>
      <div className={styles.formRow}>
        <input
          id={inputId}
          type="email"
          autoComplete="email"
          placeholder="you@yourbusiness.com"
          className={styles.input}
          value={email}
          aria-invalid={error}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(false);
          }}
        />
        <button type="submit" className={styles.primaryBtn}>
          Get early access
        </button>
      </div>
      {error ? (
        <span id={errorId} className={styles.formError}>
          Enter an email address so we can reach you.
        </span>
      ) : null}
    </form>
  );
}
