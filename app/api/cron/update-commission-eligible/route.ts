import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

function computeBucketMonth(returnWindowEndsAt: string): string {
  const d = new Date(returnWindowEndsAt);
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth(); // 0-indexed
  const bucketMonth = day <= 10 ? month : month + 1;
  return new Date(Date.UTC(year, bucketMonth, 1)).toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: orders, error } = await supabase
    .from("referral_orders")
    .select("id, return_window_ends_at")
    .eq("status", "delivered")
    .lte("return_window_ends_at", now)
    .is("payout_bucket_month", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let updated = 0;
  for (const order of orders || []) {
    const bucketMonth = computeBucketMonth(order.return_window_ends_at as string);
    const { error: updateError } = await supabase
      .from("referral_orders")
      .update({ status: "commission_eligible", payout_bucket_month: bucketMonth })
      .eq("id", order.id);

    if (!updateError) updated++;
  }

  return NextResponse.json({ success: true, found: orders?.length || 0, updated });
}
