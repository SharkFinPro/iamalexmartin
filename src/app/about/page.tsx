import Banner from "@/components/Banner";
import type { Metadata } from "next";
import styles from "./About.module.scss";
import RichTextWidget from "@/components/RichTextWidget";
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
      content {
        raw
      }
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
  const isAdmin = await isAuthed();

  return <>
    <Banner
      title={description.header}
      description={description.description}
      edit={{ isAdmin, model: "Description", id: description.id, titleField: "header", descriptionField: "description" }}
    />
    <div className={styles.container}>
      <RichTextWidget content={response.data.richTextWidgets[0].content.raw} />
    </div>
  </>
}