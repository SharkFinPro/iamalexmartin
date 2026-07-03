import { notFound } from 'next/navigation'
import { cache } from "react";
import styles from "./Project.module.scss";
import { Metadata } from "next";
import Banner from "@/components/Banner";
import ProjectBlocks from "@/components/ProjectBlocks/ProjectBlocks";
import ProjectPageEditor from "@/components/ProjectBlocks/editor/ProjectPageEditor";
import { sanitizeProjectPage } from "@/components/ProjectBlocks/blocks";
import { cmsQuery } from "@/lib/cms";
import { isAuthed } from "@/lib/auth";
import { getSiteConfig } from "@/lib/getSiteConfig";
import { projectFlags } from "@/lib/siteConfig";

// One query serves both the page and generateMetadata: cache() dedupes the
// call within a single request, halving the per-request Hygraph round-trips.
//
// Note: CMS/network failures are deliberately NOT caught here. A Hygraph outage
// is an error, not a missing page — mapping it to notFound() would tell crawlers
// the page is gone and mask the real problem.
const getProject = cache(async (slug: string) => {
  const data = await cmsQuery(
    `
      query Projects($slug: String!) {
        projects(where: { slug: $slug }) {
          id
          title
          description
          tags
          projectPageDescription
          projectPage
          image {
            url
          }
        }
      }
    `,
    { slug: slug.toLowerCase() }
  );

  return data.projects[0];
});

export default async function Page({ params }) {
  const { slug } = await params;

  const [project, { data: config }, isAdmin] = await Promise.all([
    getProject(slug),
    getSiteConfig(),
    isAuthed()
  ]);

  // The query returns an empty list (not an error) for a slug that doesn't
  // exist, so a missing project must 404 here — otherwise the render below
  // would crash on `project.projectPage` and serve a 500.
  if (!project) {
    notFound();
  }

  // Hidden or archived projects are reachable only while in admin mode.
  const flags = projectFlags(config, slug.toLowerCase());
  if (!isAdmin && (!flags.visible || flags.archived)) {
    notFound();
  }

  // projectPage is the case-study block list. It is null until populated in the
  // CMS, so sanitizeProjectPage coerces a missing value to an empty list.
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
            entryId={project.id}
            title={project.title}
            initialBlocks={blocks}
          />
        ) : (
          blocks.length > 0 && <ProjectBlocks blocks={blocks} />
        )}
      </main>
    </>
  );
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;

  const project = await getProject(slug);

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