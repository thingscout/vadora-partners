import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { calculateGstExclusive } from "@/lib/utils";

function verifyHmac(rawBody: string, hmacHeader: string | null): boolean {
  if (!hmacHeader) return false;
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET!;
  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const digestBuffer = Buffer.from(digest);
  const headerBuffer = Buffer.from(hmacHeader);
  if (digestBuffer.length !== headerBuffer.length) return false;
  return crypto.timingSafeEqual(digestBuffer, headerBuffer);
}

async function handleOrderCreated(supabase: ReturnType<typeof createAdminClient>, order: any) {
  const shopifyOrderId = String(order.id);
  const discountCode: string | undefined = order.discount_codes?.[0]?.code;

  if (!discountCode) {
    await supabase.from("shopify_webhook_log").insert({
      shopify_order_id: shopifyOrderId,
      discount_code: null,
      raw_payload: order,
      status: "ignored_no_code",
    });
    return;
  }

  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .ilike("referral_code", discountCode)
    .maybeSingle();

  if (!partner) {
    await supabase.from("shopify_webhook_log").insert({
      shopify_order_id: shopifyOrderId,
      discount_code: discountCode,
      raw_payload: order,
      status: "ignored_no_code",
    });
    return;
  }

  const totalPrice = Number(order.current_total_price ?? order.total_price ?? 0);
  const gstExclusiveAmount = calculateGstExclusive(totalPrice);
  const customerName =
    [order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(" ") ||
    order.shipping_address?.name ||
    "Unknown";

  const { error: insertError } = await supabase.from("referral_orders").insert({
    partner_id: partner.id,
    order_ref: order.name || `#${order.order_number ?? order.id}`,
    customer_name: customerName,
    customer_email: order.customer?.email || order.email || null,
    customer_phone: order.customer?.phone || order.shipping_address?.phone || null,
    order_amount: totalPrice,
    commission_rate: null,
    commission_amount: null,
    status: "confirmed",
    order_date: order.created_at || new Date().toISOString(),
    gst_exclusive_amount: gstExclusiveAmount,
    shopify_order_id: shopifyOrderId,
    discount_code_used: discountCode,
  });

  await supabase.from("shopify_webhook_log").insert({
    shopify_order_id: shopifyOrderId,
    discount_code: discountCode,
    raw_payload: order,
    matched_partner_id: partner.id,
    status: insertError ? "error" : "processed",
    error_message: insertError?.message || null,
  });
}

async function handleOrderDelivered(supabase: ReturnType<typeof createAdminClient>, payload: any) {
  const shopifyOrderId = String(payload.order_id ?? payload.id);
  const deliveredAt = new Date();
  const returnWindowEndsAt = new Date(deliveredAt.getTime() + 3 * 24 * 60 * 60 * 1000);

  const { error } = await supabase
    .from("referral_orders")
    .update({
      status: "delivered",
      delivered_at: deliveredAt.toISOString(),
      return_window_ends_at: returnWindowEndsAt.toISOString(),
    })
    .eq("shopify_order_id", shopifyOrderId);

  await supabase.from("shopify_webhook_log").insert({
    shopify_order_id: shopifyOrderId,
    raw_payload: payload,
    status: error ? "error" : "processed",
    error_message: error?.message || null,
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");

  if (!verifyHmac(rawBody, hmacHeader)) {
    return NextResponse.json({ error: "Invalid HMAC signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const topic = request.headers.get("x-shopify-topic") || "";
  const supabase = createAdminClient();

  if (topic.includes("fulfillment") || topic === "orders/fulfilled") {
    await handleOrderDelivered(supabase, payload);
  } else {
    await handleOrderCreated(supabase, payload);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
