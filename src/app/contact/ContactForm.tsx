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
  const [sentEmail, setSentEmail] = useState("");
  const contactFormRef = useRef<HTMLFormElement>(null);

  function handleMessageSubmit(event: any) {
    event.preventDefault();
    setIsSubmitting(true);
    setShouldShowStatus(false);

    const { name, email, subject, message } = event.target;
    setSentEmail(email.value);

    let wasSuccessful = false;

    sendMessage(name.value, email.value, subject.value, message.value)
      .then(() => {
        setStatus(true);
        wasSuccessful = true;
      })
      .catch(err => {
        setStatus(false);
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
    <form className={styles.formContent} onSubmit={handleMessageSubmit} ref={contactFormRef}>
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
        <p className={styles.formSubmitFailure} role="alert">Message failed to send. Please try again.</p>
      )}
      <div className={styles.twoColumns}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Full Name</label>
          <input type="text" id="name" name="name" placeholder="Your name" required />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="email">Email Address</label>
          <input type="email" id="email" name="email" placeholder="your@email.com" required />
        </div>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="subject">Subject</label>
        <input type="text" id="subject" name="subject" placeholder="What's this about?" required />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" placeholder="What do you want to discuss?" required />
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