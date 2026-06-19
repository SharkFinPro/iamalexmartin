"use server";

import { isAuthed } from "@/lib/auth";
import { cmsMutate, cmsUpload } from "@/lib/cms";
import { getAssetById, type MediaAsset } from "@/lib/getAssets";
import { getSiteConfig } from "@/lib/getSiteConfig";
import { normalizeConfig, type SiteConfigData } from "@/lib/siteConfig";

type ActionResult = { ok: true } | { ok: false; error: string };

// Per-model whitelist of inline-editable fields. Keeps writes to safe, simple
// scalar/list fields (no rich-text, no images, no relations). Keys are Hygraph
// model API IDs (singular, PascalCase); they're interpolated into mutation names
// so only these exact values are ever used.
const EDITABLE_FIELDS: Record<string, string[]> = {
  Project: ["title", "description", "tags", "projectPageDescription"],
  Description: ["header", "description"],
  PortfolioCard: ["title", "description", "shortDescription", "linkText"]
};

const SAVE_CONFIG_MUTATION = `
  mutation SaveConfig($id: ID!, $data: Json!) {
    updateSiteConfig(where: { id: $id }, data: { data: $data }) { id }
  }
`;

const PUBLISH_CONFIG_MUTATION = `
  mutation PublishConfig($id: ID!) {
    publishSiteConfig(where: { id: $id }, to: PUBLISHED) { id }
  }
`;

/** Persist the full siteConfig JSON. Merges over current to fill any gaps. */
export async function saveConfig(data: Partial<SiteConfigData>): Promise<ActionResult> {
  if (!(await isAuthed())) {
    return { ok: false, error: "Not authorized." };
  }

  const { id } = await getSiteConfig();
  if (!id) {
    return { ok: false, error: "No siteConfig entry exists in the CMS." };
  }

  const normalized = normalizeConfig(data);

  try {
    await cmsMutate(SAVE_CONFIG_MUTATION, { id, data: normalized });
  } catch (e: any) {
    return { ok: false, error: `Update (draft) failed: ${e?.message || e}` };
  }

  try {
    await cmsMutate(PUBLISH_CONFIG_MUTATION, { id });
  } catch (e: any) {
    return { ok: false, error: `Publish failed: ${e?.message || e}` };
  }

  // No revalidatePath: the public pages are force-dynamic (fresh on next
  // navigation), and the Hygraph read CDN lags briefly after a write — a refetch
  // here would clobber the optimistic UI with stale data.
  return { ok: true };
}

const PUBLISH_ASSET_MUTATION = `
  mutation PublishAsset($id: ID!) {
    publishAsset(where: { id: $id }, to: PUBLISHED) { id }
  }
`;

const UNPUBLISH_ASSET_MUTATION = `
  mutation UnpublishAsset($id: ID!) {
    unpublishAsset(where: { id: $id }, from: PUBLISHED) { id }
  }
`;

/** Publish a single media asset (DRAFT -> PUBLISHED) from the admin UI. */
export async function publishAsset(id: string): Promise<ActionResult> {
  if (!(await isAuthed())) {
    return { ok: false, error: "Not authorized." };
  }

  try {
    await cmsMutate(PUBLISH_ASSET_MUTATION, { id });
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to publish asset." };
  }

  return { ok: true };
}

// Hygraph won't let `fileName` be edited in place (it's bound to the uploaded
// binary), so the display name is a custom `title` field added to the Asset
// model. An empty value clears the title (the UI falls back to fileName).
const RENAME_ASSET_MUTATION = `
  mutation RenameAsset($id: ID!, $title: String) {
    updateAsset(where: { id: $id }, data: { title: $title }) { id }
  }
`;

/**
 * Set a media asset's display name (the custom `title` field). Mirrors the
 * site's inline-edit flow (write the DRAFT, then publish) but is stage-aware:
 * an already-published asset is re-published so the change goes live, while a
 * draft-only asset stays a draft — renaming must not silently publish it.
 */
export async function renameAsset(
  id: string,
  title: string,
  republish: boolean
): Promise<ActionResult> {
  if (!(await isAuthed())) {
    return { ok: false, error: "Not authorized." };
  }

  const trimmed = title.trim();

  try {
    await cmsMutate(RENAME_ASSET_MUTATION, { id, title: trimmed || null });
    if (republish) {
      await cmsMutate(PUBLISH_ASSET_MUTATION, { id });
    }
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to rename asset." };
  }

  return { ok: true };
}

type UploadResult = { ok: true; asset: MediaAsset } | { ok: false; error: string };

/**
 * Upload a new media asset (typically a client-cropped image) to Hygraph. The
 * asset lands as a DRAFT — consistent with the rest of the library, the admin
 * publishes it explicitly afterward. An optional display name is written to the
 * custom `title` field. Returns the fully-resolved asset so the gallery can
 * insert it without a full refetch.
 */
export async function uploadAsset(formData: FormData): Promise<UploadResult> {
  if (!(await isAuthed())) {
    return { ok: false, error: "Not authorized." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file provided." };
  }

  const rawTitle = formData.get("title");
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";

  try {
    const { id } = await cmsUpload(file);

    if (title) {
      await cmsMutate(RENAME_ASSET_MUTATION, { id, title });
    }

    // Hygraph ingests the uploaded binary asynchronously: the asset record
    // exists immediately but its `url`/dimensions aren't ready until processing
    // finishes. Poll until `size` populates so the returned asset renders right
    // away (no manual refresh). Bounded so the action can't hang.
    let asset = await getAssetById(id);
    for (let attempt = 0; attempt < 12 && asset && asset.size == null; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 750));
      asset = await getAssetById(id);
    }

    if (!asset) {
      return { ok: false, error: "Upload succeeded but the asset could not be loaded." };
    }

    return { ok: true, asset };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to upload asset." };
  }
}

/** Unpublish a single media asset (remove it from the PUBLISHED stage). */
export async function unpublishAsset(id: string): Promise<ActionResult> {
  if (!(await isAuthed())) {
    return { ok: false, error: "Not authorized." };
  }

  try {
    await cmsMutate(UNPUBLISH_ASSET_MUTATION, { id });
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to unpublish asset." };
  }

  return { ok: true };
}

/**
 * Update a single simple field on any whitelisted CMS entry (by id), then
 * publish it. `model` is validated against EDITABLE_FIELDS before being used in
 * the mutation name, so it can't be injected.
 */
export async function updateContentField(
  model: string,
  id: string,
  field: string,
  value: any
): Promise<ActionResult> {
  if (!(await isAuthed())) {
    return { ok: false, error: "Not authorized." };
  }

  const allowed = EDITABLE_FIELDS[model];
  if (!allowed || !allowed.includes(field)) {
    return { ok: false, error: `Field "${field}" on "${model}" is not editable.` };
  }

  const updateMutation = `
    mutation Update($id: ID!, $data: ${model}UpdateInput!) {
      update${model}(where: { id: $id }, data: $data) { id }
    }
  `;
  const publishMutation = `
    mutation Publish($id: ID!) {
      publish${model}(where: { id: $id }, to: PUBLISHED) { id }
    }
  `;

  try {
    await cmsMutate(updateMutation, { id, data: { [field]: value } });
    await cmsMutate(publishMutation, { id });
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to update content." };
  }

  // No revalidatePath: the read CDN lags after a write, so the client shows the
  // saved value optimistically instead of refetching stale data.
  return { ok: true };
}
