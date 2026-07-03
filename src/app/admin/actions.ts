"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { checkAdminKey, setSession, clearSession } from "@/lib/auth";
import { rateLimit, clientIpFrom } from "@/lib/rateLimit";

/** Verify the submitted key; on success issue a session and redirect home. */
export async function login(key: string, redirectTo: string = "/"): Promise<{ error: string } | void> {
  // Brute-force protection: a handful of attempts per window per IP, plus a
  // flat delay on failure so even within the window guessing stays slow.
  const ip = clientIpFrom((await headers()).get("x-forwarded-for"));
  if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
    return { error: "Too many attempts. Please try again later." };
  }

  if (!(await checkAdminKey(key))) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { error: "Incorrect key." };
  }
  await setSession();
  redirect(redirectTo || "/");
}

export async function logout(redirectTo: string = "/"): Promise<void> {
  await clearSession();
  redirect(redirectTo || "/");
}
