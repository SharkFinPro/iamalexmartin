"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveConfig } from "./contentActions";
import { logout } from "./actions";
import type { SiteConfigData } from "@/lib/siteConfig";
import styles from "./admin.module.scss";

const HOMEPAGE_TOGGLES: { key: keyof SiteConfigData["homepage"]; label: string }[] = [
  { key: "showPortfolioCards", label: "Show portfolio cards on the homepage" },
  { key: "showFeaturedProjects", label: "Show featured projects section" }
];

export default function DashboardControls({ config }: { config: SiteConfigData }) {
  const router = useRouter();
  const [cfg, setCfg] = useState(config);
  const [status, setStatus] = useState("");

  async function toggle(key: keyof SiteConfigData["homepage"]) {
    const prev = cfg;
    const next = { ...cfg, homepage: { ...cfg.homepage, [key]: !cfg.homepage[key] } };
    setCfg(next);
    setStatus("Saving...");
    const result = await saveConfig(next);
    if ("error" in result) {
      setCfg(prev);
      setStatus(`Error: ${result.error}`);
    } else {
      setStatus("Saved.");
      router.refresh();
    }
  }

  return (
    <main className={styles.container} id="main-content" tabIndex={-1}>
      <section className={styles.panel}>
        <h2>Homepage</h2>
        {HOMEPAGE_TOGGLES.map(({ key, label }) => (
          <label key={key} className={styles.toggle}>
            <input type="checkbox" checked={!!cfg.homepage[key]} onChange={() => toggle(key)} />
            {label}
          </label>
        ))}
        {status && <p className={styles.status}>{status}</p>}
      </section>

      <section className={styles.panel}>
        <h2>Media</h2>
        <Link href="/admin/media" className={styles.link}>
          Open Media Library
        </Link>
      </section>

      <section className={styles.panel}>
        <h2>Session</h2>
        <button type="button" className={styles.logout} onClick={() => logout("/")}>
          Logout
        </button>
      </section>
    </main>
  );
}
