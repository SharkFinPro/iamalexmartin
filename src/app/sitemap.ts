import type { MetadataRoute } from "next";
import { cmsQuery } from "@/lib/cms";
import { getSiteConfig } from "@/lib/getSiteConfig";
import { projectFlags } from "@/lib/siteConfig";

const SLUGS_QUERY = `
  query Slugs {
    projects {
      slug
      updatedAt
    }
  }
`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.iamalexmartin.com";

  // No lastModified on static routes: the previous "now on every request"
  // value changed on every crawl, which teaches crawlers to ignore it.
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: "weekly",
      priority: 1.0
    },
    {
      url: `${baseUrl}/projects`,
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: "weekly",
      priority: 0.7
    },
    {
      url: `${baseUrl}/contact`,
      changeFrequency: "monthly",
      priority: 0.6
    }
  ];

  // Crawlers carry no admin cookie, so these reads are cached automatically.
  const [data, { data: config }] = await Promise.all([cmsQuery(SLUGS_QUERY), getSiteConfig()]);

  const dynamicProjectPages: MetadataRoute.Sitemap = data.projects
    .filter(({ slug }: { slug: string }) => {
      const flags = projectFlags(config, slug);
      return flags.visible && !flags.archived;
    })
    .map(({ slug, updatedAt }: { slug: string; updatedAt: string }) => ({
      // Real CMS edit time, so crawlers learn which case studies changed.
      url: `${baseUrl}/projects/${slug}`,
      lastModified: new Date(updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7
    }));

  return [...staticPages, ...dynamicProjectPages];
}
