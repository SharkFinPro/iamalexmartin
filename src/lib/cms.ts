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

/** Write to the CMS using the server-only mutation token. */
export function cmsMutate(query: string, variables: GraphQLVariables = {}) {
  return cmsRequest(query, variables, process.env.HYGRAPH_MUTATION_TOKEN);
}
