import type { MetadataRoute } from "next";

const SLUGS_QUERY = `
  query Slugs {
    projects {
      slug
    }
  }
`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://iamalexmartin.com";
  const currentDate = new Date()

  const staticPages = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    }
  ];

  const response = await fetch(process.env.CMS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: SLUGS_QUERY
    })
  });
  const json = await response.json();

  const dynamicProjectPages = json.data.projects.map(({ slug }) => ({
    url: `${baseUrl}/projects/${slug}`,
    lastModified: currentDate,
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  // @ts-ignore
  return [
    ...staticPages,
    ...dynamicProjectPages,
  ];
}