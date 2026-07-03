import Banner from "@/components/Banner";
import type { Metadata } from "next";
import styles from "./About.module.scss";
import ProjectBlocks from "@/components/ProjectBlocks/ProjectBlocks";
import ProjectPageEditor from "@/components/ProjectBlocks/editor/ProjectPageEditor";
import { sanitizeProjectPage } from "@/components/ProjectBlocks/blocks";
import JsonLd from "@/components/JsonLd";
import { personJsonLd } from "@/lib/jsonLd";
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
      blockLayout
    }
  }
`;

export default async function Page() {
  const [data, isAdmin] = await Promise.all([cmsQuery(QUERY), isAuthed()]);
  const description = data.descriptions[0];
  const widget = data.richTextWidgets[0];

  // blockLayout is the About page's block list (same system as project pages). It
  // is null until populated, so sanitizeProjectPage coerces a missing/invalid
  // value to an empty list — the page never crashes on bad data.
  const blocks = sanitizeProjectPage(widget?.blockLayout);

  return <>
    <JsonLd data={personJsonLd} />
    <Banner
      title={description.header}
      description={description.description}
      edit={{ isAdmin, model: "Description", id: description.id, titleField: "header", descriptionField: "description" }}
    />
    <main className={styles.container} id="main-content" tabIndex={-1}>
      {isAdmin ? (
        <ProjectPageEditor
          entryId={widget.id}
          title={description.header}
          model="RichTextWidget"
          field="blockLayout"
          initialBlocks={blocks}
          naturalHeroImage
        />
      ) : (
        blocks.length > 0 && <ProjectBlocks blocks={blocks} naturalHeroImage />
      )}
    </main>
  </>
}
