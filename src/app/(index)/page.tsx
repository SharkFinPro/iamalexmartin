import styles from "./index.module.scss";
import Landing from "./Landing";
import Portfolio from "./Portfolio";
import type { Metadata } from "next";

export const metadata : Metadata = {
  title: "Portfolio"
};

const PORTFOLIO_QUERY = `
  query PortfolioCards {
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
  const portfolioCardsRequest = await fetch(process.env.CMS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: PORTFOLIO_QUERY
    })
  });

  const portfolioCards = await portfolioCardsRequest.json();


  return <>
    <Landing className={`${styles.wrapper} ${styles.homepage}`} />

    <Portfolio className={`${styles.wrapper} ${styles.welcome}`} cards={portfolioCards.data.portfolioCards} />
  </>
}