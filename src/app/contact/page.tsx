import styles from "./contact.module.scss";
import Banner from "@/components/Banner";
import type { Metadata } from "next";
import ContactForm from "./ContactForm";

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
        <ContactForm />
      </div>
    </div>
  </>
}