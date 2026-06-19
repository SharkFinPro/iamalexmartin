// Shared Hygraph helpers. Reads use the public endpoint; mutations attach the
// server-only Permanent Auth Token and must only ever run on the server.

type GraphQLVariables = Record<string, any>;

async function cmsRequest(query: string, variables: GraphQLVariables, token?: string) {
  // Mutations may need the regular Content API host rather than the cached read
  // CDN; fall back to CMS_ENDPOINT when no dedicated mutation endpoint is set.
  const endpoint = (token && process.env.CMS_MUTATION_ENDPOINT) || process.env.CMS_ENDPOINT;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store"
  });

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors.map((e: any) => e.message).join("; "));
  }

  return json.data;
}

/** Read from the CMS via the public endpoint. */
export function cmsQuery(query: string, variables: GraphQLVariables = {}) {
  return cmsRequest(query, variables);
}

/**
 * Authenticated read using the mutation token. Needed to read DRAFT-stage
 * content (the public endpoint only serves PUBLISHED). Server-only.
 */
export function cmsQueryAuthed(query: string, variables: GraphQLVariables = {}) {
  return cmsRequest(query, variables, process.env.HYGRAPH_MUTATION_TOKEN);
}

/** Write to the CMS using the server-only mutation token. */
export function cmsMutate(query: string, variables: GraphQLVariables = {}) {
  return cmsRequest(query, variables, process.env.HYGRAPH_MUTATION_TOKEN);
}

// Hygraph's direct-upload flow (the legacy `<host>/upload` endpoint is disabled
// on newer projects): `createAsset` returns a pre-signed S3 POST payload, then
// the binary is POSTed straight to storage. The asset lands in the DRAFT stage.
const CREATE_ASSET_MUTATION = `
  mutation CreateAsset($fileName: String!) {
    createAsset(data: { fileName: $fileName }) {
      id
      upload {
        requestPostData {
          url
          date
          key
          signature
          algorithm
          policy
          credential
          securityToken
        }
      }
    }
  }
`;

/**
 * Upload a binary file to Hygraph via the direct-upload (pre-signed POST) flow.
 * Returns the new asset id. Server-only — `createAsset` uses the mutation token;
 * the file POST goes to the signed storage URL (no token).
 */
export async function cmsUpload(file: File): Promise<{ id: string }> {
  const data = await cmsMutate(CREATE_ASSET_MUTATION, { fileName: file.name });
  const asset = data?.createAsset;
  const post = asset?.upload?.requestPostData;
  if (!asset?.id || !post?.url) {
    throw new Error("Couldn't initialize the asset upload.");
  }

  // Field order matters to S3: all signed policy fields first, the file last.
  const form = new FormData();
  form.append("X-Amz-Date", post.date);
  form.append("key", post.key);
  form.append("X-Amz-Signature", post.signature);
  form.append("X-Amz-Algorithm", post.algorithm);
  form.append("policy", post.policy);
  form.append("X-Amz-Credential", post.credential);
  if (post.securityToken) form.append("X-Amz-Security-Token", post.securityToken);
  // Note: do NOT append Content-Type — the signed policy rejects extra fields.
  form.append("file", file);

  const response = await fetch(post.url, { method: "POST", body: form });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Asset upload failed (HTTP ${response.status}).${detail ? ` ${detail.slice(0, 200)}` : ""}`
    );
  }

  return { id: asset.id };
}
