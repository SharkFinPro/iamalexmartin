import { notFound } from 'next/navigation'
import styles from "./Project.module.scss";
import { Metadata } from "next";
import Banner from "@/components/Banner";
import RichTextWidget from "@/components/RichTextWidget";

async function getProject(slug: string) {
  try {
    const response = await fetch(process.env.CMS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query Projects {
            projects(where: { slug: "${slug.toLowerCase()}" }) {
              title
              projectPageDescription
              projectPageContent {
                raw
              }
            }
          }
        `
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
          query Projects {
            projects(where: { slug: "${slug.toLowerCase()}" }) {
              title
              description
              tags
              image {
                url
              }
            }
          }
        `
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

  const project = await getProject(slug);

  return (
    <>
      <Banner title={project.title} description={project.projectPageDescription} />

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

    console.log(project);

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