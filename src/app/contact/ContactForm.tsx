"use client";
import styles from "./contact.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faSquareCheck } from "@fortawesome/free-solid-svg-icons";
import sendMessage from "./sendMessage";
import { useRef, useState } from "react";

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldShowStatus, setShouldShowStatus] = useState(false);
  const [status, setStatus] = useState<boolean>(false);
  const [failureMessage, setFailureMessage] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const contactFormRef = useRef<HTMLFormElement>(null);

  // Clear a field's error as soon as the visitor edits it.
  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validate(form: any): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.name.value.trim()) errs.name = "Please enter your name.";
    const email = form.email.value.trim();
    if (!email) errs.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Please enter a valid email address.";
    if (!form.subject.value.trim()) errs.subject = "Please enter a subject.";
    if (!form.message.value.trim()) errs.message = "Please enter a message.";
    return errs;
  }

  function handleMessageSubmit(event: any) {
    event.preventDefault();
    const form = event.target;

    // Validate ourselves (form is noValidate) so errors are visible, associated,
    // and announced rather than living only in native validation bubbles.
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstInvalid = ["name", "email", "subject", "message"].find((k) => nextErrors[k]);
      if (firstInvalid) form[firstInvalid]?.focus();
      return;
    }

    setIsSubmitting(true);
    setShouldShowStatus(false);

    const { name, email, subject, message } = form;
    setSentEmail(email.value);

    let wasSuccessful = false;

    sendMessage(name.value, email.value, subject.value, message.value)
      .then((result) => {
        if (result.ok) {
          setStatus(true);
          wasSuccessful = true;
        } else {
          // Server-side validation failed — show its reason rather than the
          // generic failure line.
          setStatus(false);
          setFailureMessage(result.error);
        }
      })
      .catch(err => {
        setStatus(false);
        setFailureMessage("");
        console.log(err);
      })
      .finally(() => setTimeout(() => {
        setIsSubmitting(false);
        setShouldShowStatus(true);

        if (wasSuccessful) {
          contactFormRef?.current?.reset();
        }
      }, 1000));
  }

  return (
    <form className={styles.formContent} onSubmit={handleMessageSubmit} ref={contactFormRef} noValidate>
      {/* Persistent polite live region: success + "sending" are announced without
          stealing focus. */}
      <div role="status" aria-live="polite" aria-atomic="true">
        {isSubmitting && <p className="srOnly">Sending your message…</p>}
        {shouldShowStatus && status && (
          <p className={styles.formSubmitSuccess}>
            <FontAwesomeIcon icon={faSquareCheck} /> Message sent! A copy has been sent to {sentEmail}!
            <br />
            <span>Check your spam folder if you did not receive a confirmation email.</span>
          </p>
        )}
      </div>
      {/* Failures are assertive so the visitor hears them immediately. */}
      {shouldShowStatus && !status && (
        <p className={styles.formSubmitFailure} role="alert">
          {failureMessage || "Message failed to send. Please try again."}
        </p>
      )}
      <div className={styles.twoColumns}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Full Name</label>
          <input
            type="text" id="name" name="name" placeholder="Your name" required
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            onInput={() => clearError("name")}
          />
          {errors.name && <span id="name-error" className={styles.fieldError} role="alert">{errors.name}</span>}
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="email">Email Address</label>
          <input
            type="email" id="email" name="email" placeholder="your@email.com" required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            onInput={() => clearError("email")}
          />
          {errors.email && <span id="email-error" className={styles.fieldError} role="alert">{errors.email}</span>}
        </div>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="subject">Subject</label>
        <input
          type="text" id="subject" name="subject" placeholder="What's this about?" required
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? "subject-error" : undefined}
          onInput={() => clearError("subject")}
        />
        {errors.subject && <span id="subject-error" className={styles.fieldError} role="alert">{errors.subject}</span>}
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="message">Message</label>
        <textarea
          id="message" name="message" placeholder="What do you want to discuss?" required
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          onInput={() => clearError("message")}
        />
        {errors.message && <span id="message-error" className={styles.fieldError} role="alert">{errors.message}</span>}
      </div>
      <button type="submit" className={styles.formSubmit} disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            Sending...
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faPaperPlane} /> Send Message
          </>
        )}
      </button>
    </form>
  );
}