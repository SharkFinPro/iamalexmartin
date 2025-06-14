import Banner from "@/components/Banner";
import Projects from "./Projects";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata : Metadata = {
  title: "Projects"
};

export const dynamic = "force-dynamic";

const PROJECTS_QUERY = `
  query Projects {
    descriptions(where: { location: "Projects" }) {
      header
      description
    }
    __type(name: "ProjectTypes") {
      enumValues {
        name
      }
    }
    projects {
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
  const projects = await getProjects();
  const description = projects.descriptions[0];

  return (
    <>
      <Banner title={description.header} description={description.description} />

      <Suspense>
        <Projects projects={projects} />
      </Suspense>
    </>
  );
}