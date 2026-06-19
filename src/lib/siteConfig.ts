// Single source of truth for presentation/config the admin controls. Stored as
// one JSON blob in the Hygraph `siteConfig` singleton entry.
//
// This module is intentionally pure (no server-only imports) so it can be shared
// by client components. The CMS read lives in `getSiteConfig.ts`.

export type ProjectFlags = { visible: boolean; featured: boolean; archived: boolean };

/** Per-card admin flags. `hidden` pulls a card from the public homepage but keeps
 *  it recoverable from the admin "Hidden cards" area (archive, not delete). */
export type PortfolioCardFlags = { hidden: boolean };

export type SiteConfigData = {
  projectOrder: string[];                          // slugs, in display order
  featuredOrder: string[];                         // slugs, order of the featured section
  projects: Record<string, ProjectFlags>;          // per-slug flags
  portfolioCardOrder: string[];                    // card ids, in display order
  portfolioCards: Record<string, PortfolioCardFlags>; // per-card-id flags
  homepage: {
    showPortfolioCards: boolean;
    showFeaturedProjects: boolean;
  };
  site: Record<string, any>;                       // reserved for future settings
};

export const DEFAULT_CONFIG: SiteConfigData = {
  projectOrder: [],
  featuredOrder: [],
  projects: {},
  portfolioCardOrder: [],
  portfolioCards: {},
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
    portfolioCards: { ...(data?.portfolioCards || {}) },
    site: { ...(data?.site || {}) }
  };
}

export function projectFlags(config: SiteConfigData, slug: string): ProjectFlags {
  return { visible: true, featured: false, archived: false, ...config.projects[slug] };
}

export function cardFlags(config: SiteConfigData, id: string): PortfolioCardFlags {
  return { hidden: false, ...config.portfolioCards[id] };
}

/** Stable sort by an explicit list of keys; unlisted items keep order, appended. */
export function orderByKeys<T>(items: T[], order: string[], getKey: (item: T) => string): T[] {
  const rank = new Map(order.map((key, i) => [key, i]));
  return [...items].sort((a, b) => {
    const ra = rank.has(getKey(a)) ? rank.get(getKey(a))! : Infinity;
    const rb = rank.has(getKey(b)) ? rank.get(getKey(b))! : Infinity;
    return ra - rb;
  });
}

/** Stable sort by an explicit list of slugs; unlisted items keep order, appended. */
export function orderBySlugs<T extends { slug: string }>(projects: T[], order: string[]): T[] {
  return orderByKeys(projects, order, (p) => p.slug);
}

/**
 * Order projects by config.projectOrder (unlisted slugs keep CMS order, appended),
 * then optionally drop hidden/archived ones. Admins pass includeHidden to see all
 * (archived included) so the UI can group and dim them.
 */
export function applyConfigToProjects<T extends { slug: string }>(
  projects: T[],
  config: SiteConfigData,
  includeHidden = false
): T[] {
  const ordered = orderBySlugs(projects, config.projectOrder);

  if (includeHidden) {
    return ordered;
  }

  return ordered.filter((p) => {
    const flags = projectFlags(config, p.slug);
    return flags.visible && !flags.archived;
  });
}

/** Visible + featured (non-archived) projects, ordered by config.featuredOrder. */
export function featuredProjects<T extends { slug: string }>(
  projects: T[],
  config: SiteConfigData
): T[] {
  const visibleFeatured = applyConfigToProjects(projects, config).filter(
    (p) => projectFlags(config, p.slug).featured
  );
  return orderBySlugs(visibleFeatured, config.featuredOrder);
}

/**
 * Order portfolio cards by config.portfolioCardOrder (unlisted ids keep CMS order,
 * appended), then optionally drop hidden ones. Admins pass includeHidden to see all.
 */
export function applyConfigToCards<T extends { id: string }>(
  cards: T[],
  config: SiteConfigData,
  includeHidden = false
): T[] {
  const ordered = orderByKeys(cards, config.portfolioCardOrder, (c) => c.id);

  if (includeHidden) {
    return ordered;
  }

  return ordered.filter((c) => !cardFlags(config, c.id).hidden);
}
