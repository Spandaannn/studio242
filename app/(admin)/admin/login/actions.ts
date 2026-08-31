"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionCookie, SESSION_COOKIE_NAME, verifyPassword } from "@/lib/admin-session";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const ok = await verifyPassword(password);

  if (!ok) {
    redirect("/admin/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, await createSessionCookie(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 7, // 7 days — matches the cookie's own signed expiry
  });

  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: SESSION_COOKIE_NAME, path: "/admin" });
  redirect("/admin/login");
}
