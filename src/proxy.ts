import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifySession } from "@/lib/session";

// Guards the /admin dashboard only. Inline editing on public routes is enforced
// by the write Server Actions themselves, not by this proxy.
export default async function proxy(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!(await verifySession(token))) {
    const url = new URL("/admin/login", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Match /admin and its children, but not /admin/login.
  matcher: ["/admin", "/admin/((?!login).*)"]
};
