"use server";

import { redirect } from "next/navigation";
import { checkAdminKey, setSession, clearSession } from "@/lib/auth";

/** Verify the submitted key; on success issue a session and redirect home. */
export async function login(key: string, redirectTo: string = "/"): Promise<{ error: string } | void> {
  if (!(await checkAdminKey(key))) {
    return { error: "Incorrect key." };
  }
  await setSession();
  redirect(redirectTo || "/");
}

export async function logout(redirectTo: string = "/"): Promise<void> {
  await clearSession();
  redirect(redirectTo || "/");
}
