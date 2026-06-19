// Pure session crypto — no next/headers / Node imports, so it is safe to use
// from Edge middleware as well as Server Actions. Cookie store access lives in
// auth.ts. A session token is `<expiryMs>.<hmac>` signed with ADMIN_KEY.

export const ADMIN_COOKIE_NAME = "admin_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toHex(signature);
}

/** Constant-time string comparison to avoid leaking via timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Verify a submitted admin key against ADMIN_KEY (constant time). */
export async function checkAdminKey(submitted: string): Promise<boolean> {
  const expected = process.env.ADMIN_KEY;
  if (!expected || !submitted) {
    return false;
  }
  // Compare equal-length HMACs so timing can't reveal the key length.
  const [a, b] = await Promise.all([hmac(submitted, expected), hmac(expected, expected)]);
  return timingSafeEqual(a, b);
}

export async function signSession(expiry: number): Promise<string> {
  const sig = await hmac(String(expiry), process.env.ADMIN_KEY || "");
  return `${expiry}.${sig}`;
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token || !process.env.ADMIN_KEY) {
    return false;
  }
  const dot = token.indexOf(".");
  if (dot < 0) {
    return false;
  }
  const expiry = Number(token.slice(0, dot));
  const sig = token.slice(dot + 1);
  if (!Number.isFinite(expiry) || expiry < Date.now()) {
    return false;
  }
  const expected = await hmac(String(expiry), process.env.ADMIN_KEY);
  return timingSafeEqual(sig, expected);
}
