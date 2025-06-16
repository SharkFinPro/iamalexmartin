"use client";
import styles from "./contact.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import sendMessage from "./sendMessage";

export default function ContactForm() {
  function handleMessageSubmit(event: any) {
    event.preventDefault();

    const { name, email, subject, message } = event.target;

    sendMessage(name.value, email.value, subject.value, message.value)
      .then(() => console.log("Successfully sent!"))
      .catch(err => console.error(err));
  }

  return (
    <form className={styles.formContent} onSubmit={handleMessageSubmit}>
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
      <button type="submit" className={styles.formSubmit}>
        <FontAwesomeIcon icon={faPaperPlane}></FontAwesomeIcon> Send Message
      </button>
    </form>
  );
}