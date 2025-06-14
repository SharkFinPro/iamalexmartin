import styles from "./index.module.scss";
import Landing from "./Landing";
import Portfolio from "./Portfolio";
import type { Metadata } from "next";

export const metadata : Metadata = {
  title: "Portfolio"
};

const PORTFOLIO_QUERY = `
  query Portfolio {
    descriptions(where: { location: "Landing" }) {
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
  const landingDescription = response.data.descriptions[0];
  const portfolioCards = response.data.portfolioCards;


  return <>
    <Landing className={`${styles.wrapper} ${styles.homepage}`} description={landingDescription} />

    <Portfolio className={`${styles.wrapper} ${styles.welcome}`} cards={portfolioCards} />
  </>
}