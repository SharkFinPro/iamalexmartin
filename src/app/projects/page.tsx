import Banner from "@/components/Banner";
import Projects from "./Projects";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Page() {
  const response = await fetch(process.env.CMS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `query ProjectWidgets {
                projectWidgets {
                  title
                  description
                  tags
                  image {
                    url
                  }
                  type
                }
              }`
    })
  });
  const json = await response.json();
  const projects = json.data.projectWidgets;

  return <>
    <Banner title={"My Projects"} description={"Explore my technical work and creative solutions"} />

    <Suspense>
      <Projects projects={projects} />
    </Suspense>
  </>
}