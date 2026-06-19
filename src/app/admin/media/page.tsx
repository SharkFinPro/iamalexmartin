import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Banner from "@/components/Banner";
import { isAuthed } from "@/lib/auth";
import { getMediaAssets, type MediaAsset } from "@/lib/getAssets";
import MediaGallery from "./MediaGallery";
import styles from "./media.module.scss";

export const metadata: Metadata = {
  title: "Media Library",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function Page() {
  // Middleware guards /admin; re-check here as the security boundary.
  if (!(await isAuthed())) {
    redirect("/admin/login");
  }

  let assets: MediaAsset[] | null = null;
  let error: string | null = null;

  try {
    assets = await getMediaAssets();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load media.";
  }

  return (
    <>
      <Banner
        title="Media Library"
        description="All images stored in the CMS. Viewing only for now."
      />

      <div className={styles.container}>
        {error ? (
          <div className={styles.state} role="alert">
            <p className={styles.stateTitle}>Couldn&apos;t load media</p>
            <p className={styles.stateBody}>{error}</p>
          </div>
        ) : (
          <MediaGallery assets={assets ?? []} />
        )}
      </div>
    </>
  );
}
