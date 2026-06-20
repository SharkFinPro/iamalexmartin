import Banner from "@/components/Banner";
import type { Metadata } from "next";
import styles from "./About.module.scss";
import RichTextField from "@/components/RichTextField";
import { cmsQuery } from "@/lib/cms";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata : Metadata = {
  title: "About"
};

const QUERY = `
  query Portfolio {
    descriptions(where: { location: "About" }) {
      id
      header
      description
    }
    richTextWidgets(where: { title: "About" }) {
      id
      content {
        raw
      }
    }
  }
`;

export default async function Page() {
  const [data, isAdmin] = await Promise.all([cmsQuery(QUERY), isAuthed()]);
  const description = data.descriptions[0];
  const widget = data.richTextWidgets[0];

  return <>
    <Banner
      title={description.header}
      description={description.description}
      edit={{ isAdmin, model: "Description", id: description.id, titleField: "header", descriptionField: "description" }}
    />
    <main className={styles.container} id="main-content" tabIndex={-1}>
      <RichTextField model="RichTextWidget" id={widget.id} field="content" raw={widget.content.raw} isAdmin={isAdmin} />
    </main>
  </>
}