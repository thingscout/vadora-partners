import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

const MINIMUM_PAYOUT = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: orders, error: ordersError } = await supabase
    .from("referral_orders")
    .select("id, partner_id, commission_amount")
    .eq("commission_finalized", true)
    .eq("status", "commission_eligible")
    .is("payout_id", null);

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  const byPartner = new Map<string, { orderIds: string[]; total: number }>();
  for (const o of orders || []) {
    const entry = byPartner.get(o.partner_id) || { orderIds: [], total: 0 };
    entry.orderIds.push(o.id);
    entry.total += Number(o.commission_amount) || 0;
    byPartner.set(o.partner_id, entry);
  }

  const results: { partner_id: string; amount: number; paid: boolean }[] = [];

  for (const [partnerId, { orderIds, total }] of byPartner) {
    if (total < MINIMUM_PAYOUT) {
      results.push({ partner_id: partnerId, amount: total, paid: false });
      continue;
    }

    const { data: payout, error: payoutError } = await supabase
      .from("payouts")
      .insert({ partner_id: partnerId, amount: total, status: "pending" })
      .select()
      .single();

    if (payoutError || !payout) {
      results.push({ partner_id: partnerId, amount: total, paid: false });
      continue;
    }

    await supabase.from("referral_orders").update({ payout_id: payout.id }).in("id", orderIds);

    results.push({ partner_id: partnerId, amount: total, paid: true });
  }

  return NextResponse.json({ success: true, partners_processed: results.length, results });
}
