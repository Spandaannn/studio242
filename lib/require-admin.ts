import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/admin-session";

// Belt-and-suspenders on top of proxy.ts: called at the top of every
// mutating Server Action under app/admin/**. Split out from admin-session.ts
// because next/headers isn't available (or meaningful) inside proxy — this
// file is only ever imported from Server Components/Actions.
export async function requireAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const valid = await verifySessionCookie(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!valid) {
    redirect("/admin/login");
  }
}
