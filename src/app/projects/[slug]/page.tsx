import { notFound } from 'next/navigation'
import styles from "./Project.module.scss";
import { Metadata } from "next";
import Banner from "@/components/Banner";
import RichTextWidget from "@/components/RichTextWidget";
import { isAuthed } from "@/lib/auth";
import { getSiteConfig } from "@/lib/getSiteConfig";
import { projectFlags } from "@/lib/siteConfig";

async function getProject(slug: string) {
  try {
    const response = await fetch(process.env.CMS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
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
        variables: {
          slug: slug.toLowerCase()
        }
      })
    });

    const json = await response.json();

    return json.data.projects[0];
  } catch (error) {
    notFound();
  }
}

async function getProjectMetadata(slug: string) {
  try {
    const response = await fetch(process.env.CMS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
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
        variables: {
          slug: slug.toLowerCase()
        }
      })
    });

    const json = await response.json();

    return json.data.projects[0];
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

  // Hidden projects are reachable only while in admin mode.
  if (!isAdmin && !projectFlags(config, slug.toLowerCase()).visible) {
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
        <RichTextWidget content={project.projectPageContent.raw} />
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