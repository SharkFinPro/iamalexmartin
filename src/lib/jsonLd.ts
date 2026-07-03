// schema.org structured-data builders, rendered via <JsonLd> (components/JsonLd.tsx).
// Pure data — safe to import anywhere.

export const SITE_URL = "https://www.iamalexmartin.com";

/** Who the site is about — used on the home and about pages. */
export const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Alexander Martin",
  alternateName: "Alex Martin",
  url: SITE_URL,
  jobTitle: "Software Developer",
  knowsAbout: ["Computer Graphics", "Vulkan", "C++", "React", "Next.js", "Full-Stack Development"],
  sameAs: [
    "https://github.com/SharkFinPro",
    "https://www.linkedin.com/in/iamalexmartin/"
  ]
};

type ProjectSchemaInput = {
  title: string;
  description?: string;
  tags?: string[];
  image?: { url: string } | null;
};

/** Breadcrumbs + SoftwareSourceCode for a project case-study page. */
export function projectJsonLd(project: ProjectSchemaInput, slug: string) {
  const pageUrl = `${SITE_URL}/projects/${slug}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Projects", item: `${SITE_URL}/projects` },
        { "@type": "ListItem", position: 3, name: project.title, item: pageUrl }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareSourceCode",
      name: project.title,
      // JSON.stringify drops undefined fields, so optional CMS values simply
      // disappear from the output instead of rendering as null.
      description: project.description || undefined,
      url: pageUrl,
      image: project.image?.url,
      keywords: project.tags?.length ? project.tags.join(", ") : undefined,
      author: { "@type": "Person", name: "Alexander Martin", url: SITE_URL }
    }
  ];
}
