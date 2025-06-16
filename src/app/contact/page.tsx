import styles from "./contact.module.scss";
import Banner from "@/components/Banner";
import type { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

export const dynamic = "force-dynamic";

export const metadata : Metadata = {
  title: "Contact"
};

const QUERY = `
  query Portfolio {
    descriptions(where: { location: "Contact" }) {
      header
      description
    }
    contactFormDescriptions: descriptions(where: { location: "ContactForm" }) {
      header
      description
    }
  }
`;

export default async function Page() {
  const request = await fetch(process.env.CMS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: QUERY
    })
  });

  const response = await request.json();
  const description = response.data.descriptions[0];
  const contactFormDescription = response.data.contactFormDescriptions[0];

  return <>
    <Banner title={description.header} description={description.description} />

    <div className={styles.container}>
      <div className={styles.contactForm}>
        <div className={styles.formHeader}>
          <h2>{contactFormDescription.header}</h2>
          <p>{contactFormDescription.description}</p>
        </div>
        <form className={styles.formContent}>
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
      </div>
    </div>
  </>
}