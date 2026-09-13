import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { calculateCommission } from "@/lib/utils";

function currentBucketMonth(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const bucketMonth = currentBucketMonth();

  const { data: tiers, error: tiersError } = await supabase
    .from("commission_tiers")
    .select("*")
    .order("sort_order", { ascending: true });

  if (tiersError) {
    return NextResponse.json({ error: tiersError.message }, { status: 500 });
  }

  const { data: orders, error: ordersError } = await supabase
    .from("referral_orders")
    .select("id, partner_id, gst_exclusive_amount")
    .eq("payout_bucket_month", bucketMonth)
    .eq("commission_finalized", false)
    .not("status", "in", "(cancelled,returned)");

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  const byPartner = new Map<string, { orderIds: string[]; sales: number }>();
  for (const o of orders || []) {
    const entry = byPartner.get(o.partner_id) || { orderIds: [], sales: 0 };
    entry.orderIds.push(o.id);
    entry.sales += Number(o.gst_exclusive_amount) || 0;
    byPartner.set(o.partner_id, entry);
  }

  function tierForSales(sales: number) {
    const sorted = [...(tiers || [])].sort((a: any, b: any) => a.sort_order - b.sort_order);
    return [...sorted].reverse().find((t: any) => sales >= t.min_sales) || sorted[0];
  }

  const results: { partner_id: string; tier_name: string; bucket_sales: number; tier_changed: boolean }[] = [];

  for (const [partnerId, { orderIds, sales }] of byPartner) {
    const tier = tierForSales(sales);
    if (!tier) continue;

    const { data: prevHistory } = await supabase
      .from("monthly_tier_history")
      .select("tier_name")
      .eq("partner_id", partnerId)
      .lt("bucket_month", bucketMonth)
      .order("bucket_month", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error: upsertError } = await supabase
      .from("monthly_tier_history")
      .upsert(
        {
          partner_id: partnerId,
          bucket_month: bucketMonth,
          bucket_sales_gst_exclusive: sales,
          tier_id: tier.id,
          tier_name: tier.name,
          tier_rate_percent: tier.rate_percent,
          is_frozen: true,
          frozen_at: new Date().toISOString(),
        },
        { onConflict: "partner_id,bucket_month" }
      );

    if (upsertError) continue;

    const { error: ordersUpdateError } = await supabase
      .from("referral_orders")
      .update({
        commission_rate: tier.rate_percent,
        commission_finalized: true,
      })
      .in("id", orderIds);

    if (ordersUpdateError) continue;

    // commission_amount depends on each order's own gst_exclusive_amount, so set per-order
    for (const o of orders || []) {
      if (o.partner_id !== partnerId) continue;
      await supabase
        .from("referral_orders")
        .update({
          commission_amount: calculateCommission(Number(o.gst_exclusive_amount) || 0, tier.rate_percent),
        })
        .eq("id", o.id);
    }

    const tierChanged = !!prevHistory && prevHistory.tier_name !== tier.name;
    if (tierChanged) {
      await supabase.from("notifications").insert({
        partner_id: partnerId,
        type: "tier_upgrade",
        title: `Your tier changed to ${tier.name}`,
        message: `Based on your sales this cycle, your commission tier is now ${tier.name} (${tier.rate_percent}%).`,
      });
    }

    results.push({ partner_id: partnerId, tier_name: tier.name, bucket_sales: sales, tier_changed: tierChanged });
  }

  return NextResponse.json({ success: true, bucket_month: bucketMonth, partners_processed: results.length, results });
}
