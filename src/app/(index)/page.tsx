import styles from "./index.module.scss";
import Landing from "./Landing";
import Portfolio from "./Portfolio";
import FeaturedProjects from "./FeaturedProjects";
import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/getSiteConfig";
import { applyConfigToProjects, projectFlags } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";

export const metadata : Metadata = {
  title: "Portfolio"
};

const PORTFOLIO_QUERY = `
  query Portfolio {
    portfolioDescriptions: descriptions(where: { location: "Portfolio" }) {
      header
      description
    }
    landingDescriptions: descriptions(where: { location: "Landing" }) {
      header
      description
    }
    portfolioCards {
      title
      fontAwesomeIcon
      description
      shortDescription
      linkText
      link
    }
    projects {
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
  const request = await fetch(process.env.CMS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: PORTFOLIO_QUERY
    })
  });

  const response = await request.json();
  const portfolioDescription = response.data.portfolioDescriptions[0];
  const landingDescription = response.data.landingDescriptions[0];
  const portfolioCards = response.data.portfolioCards;

  const { data: config } = await getSiteConfig();

  // Featured = flagged featured in siteConfig, ordered like the projects page,
  // and still visible. applyConfigToProjects drops hidden ones for us.
  const featuredProjects = applyConfigToProjects(response.data.projects || [], config)
    .filter((project) => projectFlags(config, project.slug).featured);

  return <>
    <Landing className={`${styles.wrapper} ${styles.homepage}`} description={landingDescription} />

    {config.homepage.showPortfolioCards && (
      <Portfolio className={`${styles.wrapper} ${styles.welcome}`} cards={portfolioCards}
                 description={portfolioDescription} />
    )}

    {config.homepage.showFeaturedProjects && featuredProjects.length > 0 && (
      <FeaturedProjects className={`${styles.wrapper} ${styles.featured}`} projects={featuredProjects} />
    )}
  </>
}