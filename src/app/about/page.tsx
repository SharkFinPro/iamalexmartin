import Banner from "@/components/Banner";
import type { Metadata } from "next";
import styles from "./About.module.scss";
import RichTextWidget from "@/components/RichTextWidget";
import EditableRichText from "@/components/RichTextEditor";
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
    <div className={styles.container}>
      {/* Admins edit the rich-text field inline; visitors get the unchanged,
          server-rendered widget (same markup, no client cost or SEO impact). */}
      {isAdmin ? (
        <EditableRichText
          model="RichTextWidget"
          id={widget.id}
          field="content"
          value={widget.content.raw}
        />
      ) : (
        <RichTextWidget content={widget.content.raw} />
      )}
    </div>
  </>
}