import Banner from "@/components/Banner";
import Projects from "./Projects";
import { Suspense } from "react";
import type { Metadata } from "next";
import { cmsQuery } from "@/lib/cms";
import { isAuthed } from "@/lib/auth";
import { getSiteConfig } from "@/lib/getSiteConfig";
import { applyConfigToProjects } from "@/lib/siteConfig";

export const metadata : Metadata = {
  title: "Projects"
};

export const dynamic = "force-dynamic";

const PROJECTS_QUERY = `
  query Projects {
    descriptions(where: { location: "Projects" }) {
      id
      header
      description
    }
    __type(name: "ProjectTypes") {
      enumValues {
        name
      }
    }
    projects {
      id
      title
      slug
      description
      tags
      image {
        url
      }
      projectType
    }
  }
`;

export default async function Page() {
  const [projects, { data: config }, isAdmin] = await Promise.all([
    cmsQuery(PROJECTS_QUERY),
    getSiteConfig(),
    isAuthed()
  ]);

  const description = projects.descriptions[0];

  // Order by config; admins also see hidden projects (dimmed in the UI).
  const orderedProjects = applyConfigToProjects(projects.projects, config, isAdmin);

  return (
    <>
      <Banner
        title={description.header}
        description={description.description}
        edit={{ isAdmin, model: "Description", id: description.id, titleField: "header", descriptionField: "description" }}
      />

      <Suspense>
        <Projects
          projects={{ ...projects, projects: orderedProjects }}
          config={config}
          isAdmin={isAdmin}
        />
      </Suspense>
    </>
  );
}