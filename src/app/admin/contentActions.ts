"use server";

import { isAuthed } from "@/lib/auth";
import { cmsMutate, cmsUpload } from "@/lib/cms";
import { getAssetById, getMediaAssets, type MediaAsset } from "@/lib/getAssets";
import { getSiteConfig } from "@/lib/getSiteConfig";
import { sanitizeRichTextAst } from "@/components/RichTextEditor/richTextAst";
import { normalizeConfig, type SiteConfigData } from "@/lib/siteConfig";

type ActionResult = { ok: true } | { ok: false; error: string };

// Per-model whitelist of inline-editable fields. Keeps writes to safe, simple
// scalar/list fields (no rich-text, no images, no relations). Keys are Hygraph
// model API IDs (singular, PascalCase); they're interpolated into mutation names
// so only these exact values are ever used.
const EDITABLE_FIELDS: Record<string, string[]> = {
  Project: ["title", "description", "tags", "projectPageDescription", "projectType"],
  Description: ["header", "description"],
  PortfolioCard: ["title", "description", "shortDescription", "linkText", "link", "fontAwesomeIcon"]
};

// Rich-text (RichTextAST) fields the inline editor may write. Kept separate from
// EDITABLE_FIELDS because the value is the AST JSON, not a simple scalar/list.
const EDITABLE_RICH_TEXT_FIELDS: Record<string, string[]> = {
  Project: ["projectPageContent"],
  RichTextWidget: ["content"]
};

// --- Shared mutation helpers -------------------------------------------------
// Every action below validates the caller and then runs the same handful of
// Hygraph operations. `model` is always a validated/whitelisted PascalCase API
// ID before it reaches these helpers, so interpolating it into the mutation
// name is safe.

/** Returns the not-authorized result when the caller isn't an admin, else null. */
async function requireAuth(): Promise<{ ok: false; error: string } | null> {
  return (await isAuthed()) ? null : { ok: false, error: "Not authorized." };
}

/** Publish an entry to the PUBLISHED stage. */
function publishEntry(model: string, id: string) {
  return cmsMutate(
    `mutation Publish($id: ID!) { publish${model}(where: { id: $id }, to: PUBLISHED) { id } }`,
    { id }
  );
}

/** Remove an entry from the PUBLISHED stage. */
function unpublishEntry(model: string, id: string) {
  return cmsMutate(
    `mutation Unpublish($id: ID!) { unpublish${model}(where: { id: $id }, from: PUBLISHED) { id } }`,
    { id }
  );
}

/** Update an entry's fields on the DRAFT stage, then publish it. */
async function updateAndPublish(model: string, id: string, data: Record<string, any>) {
  await cmsMutate(
    `mutation Update($id: ID!, $data: ${model}UpdateInput!) { update${model}(where: { id: $id }, data: $data) { id } }`,
    { id, data }
  );
  await publishEntry(model, id);
}

/**
 * Permanently delete an entry. A published entry must be unpublished first, so we
 * always attempt an unpublish (ignoring the error when it isn't published) before
 * deleting. Irreversible — callers confirm with the user beforehand.
 */
async function unpublishThenDelete(model: string, id: string) {
  try {
    await unpublishEntry(model, id);
  } catch {
    // Not published (or already unpublished) — nothing to undo before delete.
  }
  await cmsMutate(
    `mutation Delete($id: ID!) { delete${model}(where: { id: $id }) { id } }`,
    { id }
  );
}

const SAVE_CONFIG_MUTATION = `
  mutation SaveConfig($id: ID!, $data: Json!) {
    updateSiteConfig(where: { id: $id }, data: { data: $data }) { id }
  }
`;

/** Persist the full siteConfig JSON (normalized to fill any missing keys). */
export async function saveConfig(data: SiteConfigData): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

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
    await publishEntry("SiteConfig", id);
  } catch (e: any) {
    return { ok: false, error: `Publish failed: ${e?.message || e}` };
  }

  // No revalidatePath: the public pages are force-dynamic (fresh on next
  // navigation), and the Hygraph read CDN lags briefly after a write — a refetch
  // here would clobber the optimistic UI with stale data.
  return { ok: true };
}

/** Publish a single media asset (DRAFT -> PUBLISHED) from the admin UI. */
export async function publishAsset(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    await publishEntry("Asset", id);
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
  const denied = await requireAuth();
  if (denied) return denied;

  const trimmed = title.trim();

  try {
    await cmsMutate(RENAME_ASSET_MUTATION, { id, title: trimmed || null });
    if (republish) {
      await publishEntry("Asset", id);
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
  const denied = await requireAuth();
  if (denied) return denied;

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

/**
 * Permanently delete a media asset. Unpublished first if needed. Irreversible —
 * the UI confirms with the user beforehand.
 */
export async function deleteAsset(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    await unpublishThenDelete("Asset", id);
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to delete asset." };
  }

  return { ok: true };
}

/** Unpublish a single media asset (remove it from the PUBLISHED stage). */
export async function unpublishAsset(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    await unpublishEntry("Asset", id);
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
  const denied = await requireAuth();
  if (denied) return denied;

  const allowed = EDITABLE_FIELDS[model];
  if (!allowed || !allowed.includes(field)) {
    return { ok: false, error: `Field "${field}" on "${model}" is not editable.` };
  }

  try {
    await updateAndPublish(model, id, { [field]: value });
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to update content." };
  }

  // No revalidatePath: the read CDN lags after a write, so the client shows the
  // saved value optimistically instead of refetching stale data.
  return { ok: true };
}

type RichTextAST = { children: any[] };

/**
 * Update a whitelisted RichText field (by id) with a full AST, then publish it.
 * `model`/`field` are validated against EDITABLE_RICH_TEXT_FIELDS before being
 * interpolated, so they can't be injected. The AST is passed straight through as
 * the field value — Hygraph RichText fields accept the `{ children }` shape.
 */
export async function updateRichTextField(
  model: string,
  id: string,
  field: string,
  content: RichTextAST
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const allowed = EDITABLE_RICH_TEXT_FIELDS[model];
  if (!allowed || !allowed.includes(field)) {
    return { ok: false, error: `Field "${field}" on "${model}" is not editable.` };
  }

  // Defense in depth: strip unsafe link schemes (javascript:/data:, etc.) before
  // persisting, so a bypassed client can't store click-XSS into public content.
  const safeContent = sanitizeRichTextAst(content);

  try {
    await updateAndPublish(model, id, { [field]: safeContent });
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to update content." };
  }

  // No revalidatePath: consistent with the other writes — the client renders the
  // saved AST optimistically rather than refetching stale CDN data.
  return { ok: true };
}

type ListAssetsResult = { assets: MediaAsset[] } | { error: string };

/**
 * List all media assets for the in-editor asset picker. Reuses the Media
 * Library's exact data layer (`getMediaAssets`) and permission check, so the
 * picker sees the same assets — there's no separate media source.
 */
export async function listMediaAssets(): Promise<ListAssetsResult> {
  if (!(await isAuthed())) {
    return { error: "Not authorized." };
  }

  try {
    return { assets: await getMediaAssets() };
  } catch (e: any) {
    return { error: e?.message || "Failed to load media." };
  }
}

// --- Portfolio cards ---------------------------------------------------------

export type PortfolioCard = {
  id: string;
  title: string;
  fontAwesomeIcon: string;
  description: string;
  shortDescription: string;
  linkText: string;
  link: string;
};

const PORTFOLIO_CARD_FIELDS = `
  id
  title
  fontAwesomeIcon
  description
  shortDescription
  linkText
  link
`;

const CREATE_PORTFOLIO_CARD_MUTATION = `
  mutation CreatePortfolioCard($data: PortfolioCardCreateInput!) {
    createPortfolioCard(data: $data) {
      ${PORTFOLIO_CARD_FIELDS}
    }
  }
`;

/**
 * Permanently delete a portfolio card. Unpublished first if needed. Irreversible
 * — the UI confirms with the user beforehand. The caller also drops the card from
 * siteConfig (order + flags).
 */
export async function deletePortfolioCard(id: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    await unpublishThenDelete("PortfolioCard", id);
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to delete card." };
  }

  return { ok: true };
}

type CreateCardResult = { ok: true; card: PortfolioCard } | { ok: false; error: string };

// Filter an arbitrary form payload down to the PortfolioCard whitelist so only
// the known simple fields are ever sent to Hygraph.
function cleanCardFields(data: Record<string, string>): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const key of EDITABLE_FIELDS.PortfolioCard) {
    if (typeof data?.[key] === "string") clean[key] = data[key];
  }
  return clean;
}

/**
 * Create a new portfolio card from the admin's form values and publish it so it
 * shows on the homepage right away. Fields are filtered against the PortfolioCard
 * whitelist. Returns the full card so the client can append + order it without a
 * refetch. Visibility/order are tracked in siteConfig by the caller.
 */
export async function createPortfolioCard(
  data: Record<string, string>
): Promise<CreateCardResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const result = await cmsMutate(CREATE_PORTFOLIO_CARD_MUTATION, { data: cleanCardFields(data) });
    const card = result?.createPortfolioCard;
    if (!card?.id) {
      return { ok: false, error: "Card was not created." };
    }
    await publishEntry("PortfolioCard", card.id);
    return { ok: true, card };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to create card." };
  }
}

/**
 * Update any subset of a portfolio card's editable fields in one write, then
 * publish. Fields are filtered against the PortfolioCard whitelist, so only the
 * known simple fields are ever sent. Backs the card edit modal.
 */
export async function updatePortfolioCard(
  id: string,
  data: Record<string, string>
): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    await updateAndPublish("PortfolioCard", id, cleanCardFields(data));
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to update card." };
  }

  return { ok: true };
}

// --- Projects ----------------------------------------------------------------

const CREATE_PROJECT_MUTATION = `
  mutation CreateProject($data: ProjectCreateInput!) {
    createProject(data: $data) { id slug }
  }
`;

type CreateProjectResult = { ok: true; id: string; slug: string } | { ok: false; error: string };

// Placeholder text fields a fresh project gets so the (required) CMS fields are
// satisfied; the admin overwrites them inline. An empty paragraph keeps the
// rich-text body valid so the project page (which reads `projectPageContent.raw`)
// renders right after the post-create redirect.
const NEW_PROJECT_DESCRIPTION = "Add a description for this project.";
const EMPTY_RICH_TEXT = { children: [{ type: "paragraph", children: [{ text: "" }] }] };

/**
 * Create a minimal project stub (title, slug, type) and publish it. Required text
 * fields get placeholders the admin overwrites inline afterward (image too). Slug
 * is lowercased to match how project pages look themselves up (see
 * projects/[slug]/page.tsx).
 */
export async function createProject(
  title: string,
  slug: string,
  projectType: string[],
  imageId: string
): Promise<CreateProjectResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  const cleanTitle = title.trim();
  const cleanSlug = slug.trim().toLowerCase();

  if (!cleanTitle || !cleanSlug) {
    return { ok: false, error: "Title and slug are required." };
  }
  if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
    return { ok: false, error: "Slug may only contain lowercase letters, numbers, and hyphens." };
  }
  if (!imageId) {
    return { ok: false, error: "An image is required." };
  }

  try {
    const data = await cmsMutate(CREATE_PROJECT_MUTATION, {
      data: {
        title: cleanTitle,
        slug: cleanSlug,
        projectType,
        description: NEW_PROJECT_DESCRIPTION,
        projectPageDescription: NEW_PROJECT_DESCRIPTION,
        projectPageContent: EMPTY_RICH_TEXT,
        image: { connect: { id: imageId } }
      }
    });
    const project = data?.createProject;
    if (!project?.id) {
      return { ok: false, error: "Project was not created." };
    }
    // Publish the asset too, so the connected image resolves on the public stage.
    await publishEntry("Asset", imageId);
    await publishEntry("Project", project.id);
    return { ok: true, id: project.id, slug: project.slug };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to create project." };
  }
}

const SET_PROJECT_IMAGE_MUTATION = `
  mutation SetProjectImage($id: ID!, $assetId: ID!) {
    updateProject(where: { id: $id }, data: { image: { connect: { id: $assetId } } }) { id }
  }
`;

/**
 * Point a project's `image` relation at an existing media asset, then publish
 * both: the asset must be published for the public (PUBLISHED-stage) read to
 * resolve its URL. Replaces any current image (to-one relation).
 */
export async function setProjectImage(id: string, assetId: string): Promise<ActionResult> {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    await cmsMutate(SET_PROJECT_IMAGE_MUTATION, { id, assetId });
    // Make sure the linked asset is live, otherwise `image { url }` is null publicly.
    await publishEntry("Asset", assetId);
    await publishEntry("Project", id);
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to set project image." };
  }

  return { ok: true };
}
