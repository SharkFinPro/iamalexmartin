import Banner from "@/components/Banner";
import Projects from "./Projects";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const PROJECTS_QUERY = `
  query ProjectWidgets {
    projectWidgets {
      title
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

  return json.data.projectWidgets;
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