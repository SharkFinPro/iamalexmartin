import styles from "./index.module.scss";
import Landing from "./Landing";
import Portfolio from "./Portfolio";
import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/getSiteConfig";

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

  return <>
    <Landing className={`${styles.wrapper} ${styles.homepage}`} description={landingDescription} />

    {config.homepage.showPortfolioCards && (
      <Portfolio className={`${styles.wrapper} ${styles.welcome}`} cards={portfolioCards}
                 description={portfolioDescription} />
    )}
  </>
}