import styles from "./contact.module.scss";
import Banner from "@/components/Banner";
import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import EditableText from "@/components/EditableText";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata : Metadata = {
  title: "Contact"
};

const QUERY = `
  query Portfolio {
    descriptions(where: { location: "Contact" }) {
      id
      header
      description
    }
    contactFormDescriptions: descriptions(where: { location: "ContactForm" }) {
      id
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
  const isAdmin = await isAuthed();

  return <>
    <Banner
      title={description.header}
      description={description.description}
      edit={{ isAdmin, model: "Description", id: description.id, titleField: "header", descriptionField: "description" }}
    />

    <div className={styles.container}>
      <div className={styles.contactForm}>
        <div className={styles.formHeader}>
          <h2>
            <EditableText model="Description" id={contactFormDescription.id} field="header" value={contactFormDescription.header} editable={isAdmin}>
              {contactFormDescription.header}
            </EditableText>
          </h2>
          <p>
            <EditableText model="Description" id={contactFormDescription.id} field="description" value={contactFormDescription.description} editable={isAdmin} multiline>
              {contactFormDescription.description}
            </EditableText>
          </p>
        </div>
        <ContactForm />
      </div>
    </div>
  </>
}