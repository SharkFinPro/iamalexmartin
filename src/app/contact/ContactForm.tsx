"use client";
import styles from "./contact.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import sendMessage from "./sendMessage";
import { useState } from "react";

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldShowStatus, setShouldShowStatus] = useState(false);
  const [status, setStatus] = useState<boolean>(false);

  function handleMessageSubmit(event: any) {
    event.preventDefault();
    setIsSubmitting(true);
    setShouldShowStatus(false);

    const { name, email, subject, message } = event.target;

    sendMessage(name.value, email.value, subject.value, message.value)
      .then(() => setStatus(true))
      .catch(err => setStatus(false))
      .finally(() => setTimeout(() => {
        setIsSubmitting(false);
        setShouldShowStatus(true);
      }, 1000));
  }

  return (
    <form className={styles.formContent} onSubmit={handleMessageSubmit}>
      {shouldShowStatus && (status ? (
        <p className={styles.formSubmitSuccess}>Success!</p>
      ) : (
        <p className={styles.formSubmitFailure}>Failure!</p>
      ))}
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