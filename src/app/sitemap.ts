import type { MetadataRoute } from "next";
import { cmsQuery } from "@/lib/cms";
import { getSiteConfig } from "@/lib/getSiteConfig";
import { projectFlags } from "@/lib/siteConfig";

const SLUGS_QUERY = `
  query Slugs {
    projects {
      slug
    }
  }
`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.iamalexmartin.com";
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

  const [data, { data: config }] = await Promise.all([cmsQuery(SLUGS_QUERY), getSiteConfig()]);

  const dynamicProjectPages = data.projects
    .filter(({ slug }) => {
      const flags = projectFlags(config, slug);
      return flags.visible && !flags.archived;
    })
    .map(({ slug }) => ({
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