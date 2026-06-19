// Single source of truth for presentation/config the admin controls. Stored as
// one JSON blob in the Hygraph `siteConfig` singleton entry.
//
// This module is intentionally pure (no server-only imports) so it can be shared
// by client components. The CMS read lives in `getSiteConfig.ts`.

export type ProjectFlags = { visible: boolean; featured: boolean };

export type SiteConfigData = {
  projectOrder: string[];                      // slugs, in display order
  projects: Record<string, ProjectFlags>;      // per-slug flags
  homepage: {
    showPortfolioCards: boolean;
    showFeaturedProjects: boolean;
  };
  site: Record<string, any>;                   // reserved for future settings
};

export const DEFAULT_CONFIG: SiteConfigData = {
  projectOrder: [],
  projects: {},
  homepage: {
    showPortfolioCards: true,
    showFeaturedProjects: true
  },
  site: {}
};

/** Fill in any missing keys so callers can rely on a complete shape. */
export function normalizeConfig(data: Partial<SiteConfigData> | null | undefined): SiteConfigData {
  return {
    ...DEFAULT_CONFIG,
    ...(data || {}),
    homepage: { ...DEFAULT_CONFIG.homepage, ...(data?.homepage || {}) },
    projects: { ...(data?.projects || {}) },
    site: { ...(data?.site || {}) }
  };
}

export function projectFlags(config: SiteConfigData, slug: string): ProjectFlags {
  return config.projects[slug] || { visible: true, featured: false };
}

/**
 * Order projects by config.projectOrder (unlisted slugs keep CMS order, appended),
 * then optionally drop non-visible ones. Admins pass includeHidden to see all.
 */
export function applyConfigToProjects<T extends { slug: string }>(
  projects: T[],
  config: SiteConfigData,
  includeHidden = false
): T[] {
  const order = config.projectOrder;
  const rank = new Map(order.map((slug, i) => [slug, i]));

  const ordered = [...projects].sort((a, b) => {
    const ra = rank.has(a.slug) ? rank.get(a.slug)! : Infinity;
    const rb = rank.has(b.slug) ? rank.get(b.slug)! : Infinity;
    return ra - rb;
  });

  if (includeHidden) {
    return ordered;
  }

  return ordered.filter((p) => projectFlags(config, p.slug).visible);
}
