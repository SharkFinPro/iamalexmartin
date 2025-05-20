import Banner from "@/components/Banner";
import Projects from "./Projects";
import { Suspense } from "react";

export default function Page() {
  return <>
    <Banner title={"My Projects"} description={"Explore my technical work and creative solutions"} />

    <Suspense>
      <Projects />
    </Suspense>
  </>
}