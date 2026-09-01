"use server";

import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

const VALID_STATUSES = [
  "pending_payment",
  "paid",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export async function updateOrderStatus(id: string, formData: FormData) {
  await requireAdminSession();
  const rawStatus = String(formData.get("status") ?? "");

  if (!VALID_STATUSES.includes(rawStatus as (typeof VALID_STATUSES)[number])) {
    redirect(`/admin/orders/${id}?error=invalid-status`);
  }
  const status = rawStatus as (typeof VALID_STATUSES)[number];

  const { error } = await supabaseAdmin.from("orders").update({ status }).eq("id", id);

  if (error) {
    console.error("updateOrderStatus failed:", error.message);
    redirect(`/admin/orders/${id}?error=unknown`);
  }

  redirect(`/admin/orders/${id}`);
}
