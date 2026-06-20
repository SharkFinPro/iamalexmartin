import { notFound } from 'next/navigation'
import styles from "./Project.module.scss";
import { Metadata } from "next";
import Banner from "@/components/Banner";
import RichTextWidget from "@/components/RichTextWidget";
import EditableRichText from "@/components/RichTextEditor";
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

  return (
    <>
      <Banner
        title={project.title}
        description={project.projectPageDescription}
        edit={{ isAdmin, model: "Project", id: project.id, titleField: "title", descriptionField: "projectPageDescription" }}
      />

      <div className={styles.container}>
        {/* Admins edit the rich-text field inline; visitors get the unchanged,
            server-rendered widget (same markup, no client cost or SEO impact). */}
        {isAdmin ? (
          <EditableRichText
            model="Project"
            id={project.id}
            field="projectPageContent"
            value={project.projectPageContent.raw}
          />
        ) : (
          <RichTextWidget content={project.projectPageContent.raw} />
        )}
      </div>
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