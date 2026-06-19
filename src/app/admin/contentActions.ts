"use server";

import { isAuthed } from "@/lib/auth";
import { cmsMutate } from "@/lib/cms";
import { getSiteConfig } from "@/lib/getSiteConfig";
import { normalizeConfig, type SiteConfigData } from "@/lib/siteConfig";

type ActionResult = { ok: true } | { ok: false; error: string };

// Only these project fields may be edited inline. Keeps writes to safe,
// simple scalar/list fields (no rich-text, no relations).
const EDITABLE_PROJECT_FIELDS = new Set(["title", "description", "tags", "projectPageDescription"]);

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

const UPDATE_PROJECT_MUTATION = `
  mutation UpdateProject($slug: String!, $data: ProjectUpdateInput!) {
    updateProject(where: { slug: $slug }, data: $data) { id }
  }
`;

const PUBLISH_PROJECT_MUTATION = `
  mutation PublishProject($slug: String!) {
    publishProject(where: { slug: $slug }, to: PUBLISHED) { id }
  }
`;

/** Update a single simple field on a project, then publish it. */
export async function updateProjectField(
  slug: string,
  field: string,
  value: any
): Promise<ActionResult> {
  if (!(await isAuthed())) {
    return { ok: false, error: "Not authorized." };
  }
  if (!EDITABLE_PROJECT_FIELDS.has(field)) {
    return { ok: false, error: `Field "${field}" is not editable.` };
  }

  try {
    await cmsMutate(UPDATE_PROJECT_MUTATION, { slug, data: { [field]: value } });
    await cmsMutate(PUBLISH_PROJECT_MUTATION, { slug });
  } catch (e: any) {
    return { ok: false, error: e?.message || "Failed to update project." };
  }

  // No revalidatePath: the read CDN lags after a write, so the client shows the
  // saved value optimistically instead of refetching stale data.
  return { ok: true };
}
