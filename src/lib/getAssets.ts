import { cmsQueryAuthed } from "@/lib/cms";

// Media-library data layer. Kept separate from the page so future media
// features (filtering, pagination, per-asset detail) can extend the queries
// here without touching presentation. Reads run authenticated against the
// DRAFT stage so both published and unpublished assets are returned; writes
// (publish) live in admin/contentActions.ts behind the Server-Action boundary.

export type MediaStatus = "published" | "draft";

export type MediaAsset = {
  id: string;
  fileName: string;
  /** Custom Asset field (added in Hygraph): human-friendly display name. */
  title: string | null;
  url: string;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  size: number | null;
  createdAt: string;
  updatedAt: string;
  /** "published" if the document also exists in the PUBLISHED stage. */
  status: MediaStatus;
};

// Shared field selection so the list query and single-asset lookup stay in sync.
// `documentInStages` tells us whether each draft also has a published counterpart.
const ASSET_FIELDS = `
  id
  fileName
  title
  url
  mimeType
  width
  height
  size
  createdAt
  updatedAt
  documentInStages(stages: [PUBLISHED]) {
    stage
  }
`;

// Hygraph caps a single `assets` page at 100; bump to cursor pagination here if
// the library outgrows that.
const ASSETS_QUERY = `
  query MediaAssets {
    assets(stage: DRAFT, first: 100, orderBy: createdAt_DESC) {
      ${ASSET_FIELDS}
    }
  }
`;

const ASSET_BY_ID_QUERY = `
  query MediaAsset($id: ID!) {
    asset(stage: DRAFT, where: { id: $id }) {
      ${ASSET_FIELDS}
    }
  }
`;

type RawAsset = Omit<MediaAsset, "status"> & {
  documentInStages: { stage: string }[];
};

/** Derive a `MediaAsset` (with status) from a raw Hygraph asset record. */
function toMediaAsset({ documentInStages, ...asset }: RawAsset): MediaAsset {
  return {
    ...asset,
    status: documentInStages?.some((s) => s.stage === "PUBLISHED")
      ? "published"
      : "draft"
  };
}

/** Fetch all media assets (any type, draft + published), newest first. */
export async function getMediaAssets(): Promise<MediaAsset[]> {
  const data = await cmsQueryAuthed(ASSETS_QUERY);
  const assets: RawAsset[] = data?.assets ?? [];
  return assets.map(toMediaAsset);
}

/**
 * Fetch a single asset by id at the DRAFT stage (so freshly uploaded, not-yet-
 * published assets resolve). Used to return full metadata after an upload.
 */
export async function getAssetById(id: string): Promise<MediaAsset | null> {
  const data = await cmsQueryAuthed(ASSET_BY_ID_QUERY, { id });
  const raw: RawAsset | null = data?.asset ?? null;
  return raw ? toMediaAsset(raw) : null;
}
