import Banner from "@/components/Banner";
import Projects from "./Projects";
import { Suspense } from "react";
import type { Metadata } from "next";
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

async function getProjects() {
  const response = await fetch(process.env.CMS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: PROJECTS_QUERY
    })
  });
  const json = await response.json();

  return json.data;
}

export default async function Page() {
  const [projects, { data: config }, isAdmin] = await Promise.all([
    getProjects(),
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