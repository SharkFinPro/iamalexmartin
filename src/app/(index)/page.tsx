import styles from "./index.module.scss";
import Landing from "./Landing";
import Portfolio from "./Portfolio";
import FeaturedProjects from "./FeaturedProjects";
import type { Metadata } from "next";
import { cmsQuery } from "@/lib/cms";
import { isAuthed } from "@/lib/auth";
import { getSiteConfig } from "@/lib/getSiteConfig";
import { featuredProjects } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";

export const metadata : Metadata = {
  title: "Portfolio"
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
  const [data, { data: config }, isAdmin] = await Promise.all([
    cmsQuery(PORTFOLIO_QUERY),
    getSiteConfig(),
    isAuthed()
  ]);

  const portfolioDescription = data.portfolioDescriptions[0];
  const landingDescription = data.landingDescriptions[0];
  const featuredDescription = data.featuredDescriptions[0];
  const portfolioCards = data.portfolioCards;

  // Visible + featured projects, in their own featured order.
  const featured = featuredProjects(data.projects || [], config);

  return <>
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
  </>
}