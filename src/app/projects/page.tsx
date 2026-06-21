import Banner from "@/components/Banner";
import Projects from "./Projects";
import type { Metadata } from "next";
import { cmsQuery } from "@/lib/cms";
import { isAuthed } from "@/lib/auth";
import { getSiteConfig } from "@/lib/getSiteConfig";
import { applyConfigToProjects } from "@/lib/siteConfig";

export const metadata : Metadata = {
  title: "Projects"
};

export const dynamic = "force-dynamic";

// Banner copy + filter options. Small and fast, so the page shell (banner +
// type filter) can render right away without waiting on the projects list.
const META_QUERY = `
  query ProjectsMeta {
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
  }
`;

// The heavier list (with images). Fetched as a separate request and streamed
// in via Suspense so it never blocks the banner or filter.
const PROJECTS_QUERY = `
  query Projects {
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

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ projectType?: string | string[] }>;
}) {
  // Banner + filter only need the fast meta query; await it (and config/auth)
  // so the shell renders immediately. The projects list is kicked off here but
  // intentionally NOT awaited — it's passed down as a promise and streamed in.
  const [meta, { data: config }, isAdmin, params] = await Promise.all([
    cmsQuery(META_QUERY),
    getSiteConfig(),
    isAuthed(),
    searchParams
  ]);

  const description = meta.descriptions[0];
  const enumValues = meta["__type"].enumValues;

  // Resolve the active filter on the server so the correct tab is selected on
  // first paint rather than flashing "All" then correcting after hydration.
  const queried = Array.isArray(params.projectType) ? params.projectType[0] : params.projectType;
  const initialProjectType =
    queried && enumValues.some((t: any) => t.name === queried) ? queried : "all";

  // Order by config; admins also see hidden projects (dimmed in the UI). Kept
  // as a promise so the client component can suspend just the card grid on it.
  const projectsPromise = cmsQuery(PROJECTS_QUERY).then((data) =>
    applyConfigToProjects(data.projects, config, isAdmin)
  );

  return (
    <>
      <Banner
        title={description.header}
        description={description.description}
        edit={{ isAdmin, model: "Description", id: description.id, titleField: "header", descriptionField: "description" }}
      />

      <Projects
        projectsPromise={projectsPromise}
        enumValues={enumValues}
        config={config}
        isAdmin={isAdmin}
        initialProjectType={initialProjectType}
      />
    </>
  );
}