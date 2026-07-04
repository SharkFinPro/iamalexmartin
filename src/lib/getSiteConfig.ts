import { cmsQuery, type ReadOptions } from "@/lib/cms";
import { normalizeConfig, type SiteConfigData } from "@/lib/siteConfig";

const SITE_CONFIG_QUERY = `
  query SiteConfig {
    siteConfigs(first: 1) {
      id
      data
    }
  }
`;

/** Read the siteConfig singleton. Returns id + normalized data (safe defaults). */
export async function getSiteConfig(
  opts: ReadOptions = {}
): Promise<{ id: string | null; data: SiteConfigData }> {
  try {
    const result = await cmsQuery(SITE_CONFIG_QUERY, {}, opts);
    const entry = result?.siteConfigs?.[0];
    return { id: entry?.id ?? null, data: normalizeConfig(entry?.data) };
  } catch {
    return { id: null, data: normalizeConfig(null) };
  }
}
