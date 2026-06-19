import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  SESSION_TTL_MS,
  signSession,
  verifySession
} from "@/lib/session";

// Cookie-store helpers for Server Actions / pages. Pure crypto lives in
// session.ts (also used by Edge middleware).

export { checkAdminKey } from "@/lib/session";

/** Issue a session cookie. Call from a Server Action / Route Handler only. */
export async function setSession(): Promise<void> {
  const token = await signSession(Date.now() + SESSION_TTL_MS);
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
}

/** True if the current request carries a valid admin session. */
export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifySession(store.get(ADMIN_COOKIE_NAME)?.value);
}
