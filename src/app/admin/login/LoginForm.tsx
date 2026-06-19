"use client";

import { useState } from "react";
import { login } from "../actions";
import styles from "./login.module.scss";

export default function LoginForm() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const result = await login(key);
    // A successful login redirects server-side, so we only get here on failure.
    if (result && "error" in result) {
      setError(result.error);
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <p className={styles.error}>{error}</p>}
        <label htmlFor="key">Admin Key</label>
        <input
          type="password"
          id="key"
          name="key"
          autoComplete="current-password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          required
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
