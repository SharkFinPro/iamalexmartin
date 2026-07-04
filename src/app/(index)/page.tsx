import styles from "./index.module.scss";
import Landing from "./Landing";
import Portfolio from "./Portfolio";
import FeaturedProjects from "./FeaturedProjects";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { personJsonLd } from "@/lib/jsonLd";
import { cmsQuery } from "@/lib/cms";
import { isAuthed } from "@/lib/auth";
import { getSiteConfig } from "@/lib/getSiteConfig";
import { featuredProjects } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";

export const metadata : Metadata = {
  // The home page leads with the name people actually search for, instead of
  // the generic "Portfolio | Alex Martin" the template would produce.
  title: { absolute: "Alex Martin — Software Developer | Graphics & Full-Stack" }
};

const PORTFOLIO_QUERY = `
  query Portfolio {
    portfolioDescriptions: descriptions(where: { location: "Portfolio" }) {
      id
      header
      description
    }
    landingDescriptions: descriptions(where: { location: "Landing" }) {
      id
      header
      description
    }
    featuredDescriptions: descriptions(where: { location: "FeaturedProjects" }) {
      id
      header
      description
    }
    portfolioCards {
      id
      title
      fontAwesomeIcon
      description
      shortDescription
      linkText
      link
    }
    projects {
      id
      title
      slug
      description
      image {
        url
      }
    }
  }
`;

export default async function Page() {
  // isAuthed is a local cookie check (no I/O), so resolving it first to pick
  // the cache mode costs nothing: visitors get cached reads, admins fresh ones.
  const isAdmin = await isAuthed();

  const [data, { data: config }] = await Promise.all([
    cmsQuery(PORTFOLIO_QUERY, {}, { cached: !isAdmin }),
    getSiteConfig({ cached: !isAdmin })
  ]);

  const portfolioDescription = data.portfolioDescriptions[0];
  const landingDescription = data.landingDescriptions[0];
  const featuredDescription = data.featuredDescriptions[0];
  const portfolioCards = data.portfolioCards;

  // Visible + featured projects, in their own featured order.
  const featured = featuredProjects(data.projects || [], config);

  return <main id="main-content" tabIndex={-1}>
    <JsonLd data={personJsonLd} />
    <Landing className={`${styles.wrapper} ${styles.homepage}`} description={landingDescription} isAdmin={isAdmin} />

    {(config.homepage.showPortfolioCards || isAdmin) && (
      <Portfolio className={`${styles.wrapper} ${styles.welcome}`} cards={portfolioCards}
                 description={portfolioDescription} config={config} isAdmin={isAdmin} />
    )}

    {config.homepage.showFeaturedProjects && (featured.length > 0 || isAdmin) && (
      <FeaturedProjects
        className={`${styles.wrapper} ${styles.featured}`}
        projects={featured}
        description={featuredDescription}
        config={config}
        isAdmin={isAdmin}
      />
    )}
  </main>
}