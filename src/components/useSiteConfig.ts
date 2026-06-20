"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveConfig } from "@/app/admin/contentActions";
import type { SiteConfigData } from "@/lib/siteConfig";

/**
 * Optimistic siteConfig state shared by the reorderable/admin islands
 * (projects grid, featured section, portfolio cards).
 *
 * `cfg` is the live optimistic config; `cfgRef` exposes the latest value for
 * event handlers that close over stale state. `persist` writes a new config
 * immediately (optimistic) and only rolls back via `router.refresh()` on
 * failure — matching the project's no-revalidate write semantics.
 */
export function useSiteConfig(config: SiteConfigData) {
  const router = useRouter();
  const [cfg, setCfg] = useState<SiteConfigData>(config);
  const cfgRef = useRef(cfg);

  useEffect(() => { cfgRef.current = cfg; }, [cfg]);
  // Re-derive from the server only when fresh props arrive (refresh/navigation).
  useEffect(() => setCfg(config), [config]);

  async function persist(next: SiteConfigData) {
    setCfg(next);
    const result = await saveConfig(next);
    if ("error" in result) {
      alert(`Save failed: ${result.error}`);
      router.refresh();
    }
  }

  return { cfg, setCfg, cfgRef, persist };
}
