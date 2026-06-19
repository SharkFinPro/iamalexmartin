import styles from "./index.module.scss";
import Landing from "./Landing";
import Portfolio from "./Portfolio";
import FeaturedProjects from "./FeaturedProjects";
import type { Metadata } from "next";
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
  const featuredDescription = response.data.featuredDescriptions[0];
  const portfolioCards = response.data.portfolioCards;

  const [{ data: config }, isAdmin] = await Promise.all([getSiteConfig(), isAuthed()]);

  // Visible + featured projects, in their own featured order.
  const featured = featuredProjects(response.data.projects || [], config);

  return <>
    <Landing className={`${styles.wrapper} ${styles.homepage}`} description={landingDescription} isAdmin={isAdmin} />

    {config.homepage.showPortfolioCards && (
      <Portfolio className={`${styles.wrapper} ${styles.welcome}`} cards={portfolioCards}
                 description={portfolioDescription} isAdmin={isAdmin} />
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