"use server";

import { isAuthed } from "@/lib/auth";
import { cmsMutate } from "@/lib/cms";
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
