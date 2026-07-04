import styles from "./contact.module.scss";
import Banner from "@/components/Banner";
import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import EditableText from "@/components/EditableText";
import { cmsQuery } from "@/lib/cms";
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
  // Cookie check first (no I/O) so the read can be cached for visitors.
  const isAdmin = await isAuthed();
  const data = await cmsQuery(QUERY, {}, { cached: !isAdmin });
  const description = data.descriptions[0];
  const contactFormDescription = data.contactFormDescriptions[0];

  return <>
    <Banner
      title={description.header}
      description={description.description}
      edit={{ isAdmin, model: "Description", id: description.id, titleField: "header", descriptionField: "description" }}
    />

    <main className={styles.container} id="main-content" tabIndex={-1}>
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
    </main>
  </>
}