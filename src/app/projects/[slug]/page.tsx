import { notFound } from 'next/navigation'
import styles from "./Project.module.scss";
import { Metadata } from "next";
import Banner from "@/components/Banner";
import RichTextWidget from "@/components/RichTextWidget";
import ProjectBlocks from "@/components/ProjectBlocks/ProjectBlocks";
import ProjectPageEditor from "@/components/ProjectBlocks/editor/ProjectPageEditor";
import { sanitizeProjectPage } from "@/components/ProjectBlocks/blocks";
import { cmsQuery } from "@/lib/cms";
import { isAuthed } from "@/lib/auth";
import { getSiteConfig } from "@/lib/getSiteConfig";
import { projectFlags } from "@/lib/siteConfig";

async function getProject(slug: string) {
  try {
    const data = await cmsQuery(
      `
        query Projects($slug: String!) {
          projects(where: { slug: $slug }) {
            id
            title
            projectPageDescription
            projectPage
            projectPageContent {
              raw
            }
          }
        }
      `,
      { slug: slug.toLowerCase() }
    );

    return data.projects[0];
  } catch (error) {
    notFound();
  }
}

async function getProjectMetadata(slug: string) {
  try {
    const data = await cmsQuery(
      `
        query Projects($slug: String!) {
          projects(where: { slug: $slug }) {
            title
            description
            tags
            image {
              url
            }
          }
        }
      `,
      { slug: slug.toLowerCase() }
    );

    return data.projects[0];
  } catch (error) {
    notFound();
  }
}

export default async function Page({ params }) {
  const { slug } = await params;

  const [project, { data: config }, isAdmin] = await Promise.all([
    getProject(slug),
    getSiteConfig(),
    isAuthed()
  ]);

  // Hidden or archived projects are reachable only while in admin mode.
  const flags = projectFlags(config, slug.toLowerCase());
  if (!isAdmin && (!flags.visible || flags.archived)) {
    notFound();
  }

  // projectPage is the case-study block list (nullable — coerced to []). While a
  // project hasn't been migrated to blocks, visitors fall back to the legacy
  // projectPageContent rich text.
  const blocks = sanitizeProjectPage(project.projectPage);

  return (
    <>
      <Banner
        title={project.title}
        description={project.projectPageDescription}
        edit={{ isAdmin, model: "Project", id: project.id, titleField: "title", descriptionField: "projectPageDescription" }}
      />

      <main className={styles.container} id="main-content" tabIndex={-1}>
        {isAdmin ? (
          <ProjectPageEditor
            projectId={project.id}
            projectTitle={project.title}
            initialBlocks={blocks}
          />
        ) : blocks.length > 0 ? (
          <ProjectBlocks blocks={blocks} />
        ) : (
          <RichTextWidget content={project.projectPageContent?.raw} />
        )}
      </main>
    </>
  );
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;

  try {
    const project = await getProjectMetadata(slug);

    if (!project) {
      return {
        title: 'Project Not Found',
      };
    }

    return {
      title: project.title,
      description: project.description,
      keywords: project.tags,
      openGraph: {
        type: "website",
        url: `https://iamalexmartin.com/projects/${slug}`,
        title: project.title,
        description: project.description,
        siteName: "Alex Martin's Portfolio",
        images: [project.image]
      }
    }
  }
  catch (error) {
    notFound();
  }
}