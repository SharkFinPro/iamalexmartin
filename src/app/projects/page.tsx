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
    projects {
      title
      slug
      description
      tags
      image {
        url
      }
      type
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

  return json.data.projects;
}

export default async function Page() {
  const projects = await getProjects();

  return (
    <>
      <Banner
        title={"My Projects"}
        description={"Explore my technical work and creative solutions"}
      />

      <Suspense>
        <Projects projects={projects} />
      </Suspense>
    </>
  );
}