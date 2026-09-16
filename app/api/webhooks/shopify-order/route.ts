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

// Shopify line items are the only source of SKU data in the system —
// referral_orders is order-grain. Stored in referral_order_items so the admin
// panel's product report can aggregate by SKU without unnesting JSON.
async function insertLineItems(
  supabase: ReturnType<typeof createAdminClient>,
  orderId: string,
  lineItems: any[]
): Promise<{ message: string } | null> {
  const rows = lineItems.map((li) => {
    const quantity = Number(li.quantity ?? 1);
    const unitPrice = Number(li.price ?? 0);
    return {
      order_id: orderId,
      shopify_line_item_id: li.id != null ? String(li.id) : null,
      shopify_product_id: li.product_id != null ? String(li.product_id) : null,
      shopify_variant_id: li.variant_id != null ? String(li.variant_id) : null,
      sku: li.sku || null,
      product_title: li.title || li.name || "Unknown product",
      variant_title: li.variant_title || null,
      quantity,
      unit_price: unitPrice,
      line_total: unitPrice * quantity,
    };
  });

  // Webhooks retry; the unique index on shopify_line_item_id makes a repeat
  // delivery a no-op instead of double-counting units sold.
  const { error } = await supabase
    .from("referral_order_items")
    .upsert(rows, { onConflict: "shopify_line_item_id", ignoreDuplicates: true });

  return error ? { message: error.message } : null;
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

  // Upsert, not insert: Shopify retries any delivery it considers failed, and
  // orders/paid follows orders/create for the same order. ignoreDuplicates keeps
  // a repeat from resetting a later status (delivered) back to confirmed.
  const { data: inserted, error: insertError } = await supabase
    .from("referral_orders")
    .upsert({
      partner_id: partner.id,
      order_ref: order.name || `#${order.order_number ?? order.id}`,
      customer_name: customerName,
      customer_email: order.customer?.email || order.email || null,
      customer_phone: order.customer?.phone || order.shipping_address?.phone || null,
      order_amount: totalPrice,
      // commission_rate/commission_amount are NOT NULL DEFAULT 0 — an explicit
      // null is rejected rather than falling back to the default. They stay 0
      // until the finalize-bucket cron resolves the partner's monthly tier.
      commission_rate: 0,
      commission_amount: 0,
      status: "confirmed",
      order_date: order.created_at || new Date().toISOString(),
      gst_exclusive_amount: gstExclusiveAmount,
      shopify_order_id: shopifyOrderId,
      discount_code_used: discountCode,
    }, { onConflict: "shopify_order_id", ignoreDuplicates: true })
    .select("id")
    .maybeSingle();

  // On a duplicate delivery the upsert returns no row; fall back to the existing
  // one so line items still reconcile (they dedupe on shopify_line_item_id).
  let orderId: string | null = inserted?.id ?? null;
  if (!orderId && !insertError) {
    const { data: existing } = await supabase
      .from("referral_orders")
      .select("id")
      .eq("shopify_order_id", shopifyOrderId)
      .maybeSingle();
    orderId = existing?.id ?? null;
  }

  let itemsError: { message: string } | null = null;
  if (orderId && Array.isArray(order.line_items) && order.line_items.length > 0) {
    itemsError = await insertLineItems(supabase, orderId, order.line_items);
  }

  await supabase.from("shopify_webhook_log").insert({
    shopify_order_id: shopifyOrderId,
    discount_code: discountCode,
    raw_payload: order,
    matched_partner_id: partner.id,
    status: insertError || itemsError ? "error" : "processed",
    error_message: insertError?.message || itemsError?.message || null,
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

// orders/updated is deliberately absent: it fires on any edit (tags, notes,
// address) and the order is already attributed by then.
const ORDER_TOPICS = new Set(["orders/create", "orders/paid"]);

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");

  if (!verifyHmac(rawBody, hmacHeader)) {
    return NextResponse.json({ error: "Invalid HMAC signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const topic = request.headers.get("x-shopify-topic") || "";
  const supabase = createAdminClient();

  // Match topics explicitly. The old else-branch routed EVERY unrecognised topic
  // into handleOrderCreated, which is how orders/updated created duplicates.
  if (topic === "orders/fulfilled" || topic.startsWith("fulfillments/")) {
    await handleOrderDelivered(supabase, payload);
  } else if (ORDER_TOPICS.has(topic)) {
    await handleOrderCreated(supabase, payload);
  }
  // Anything else (orders/cancelled, refunds, ...) is acked and dropped -- 200
  // so Shopify stops retrying it.

  return NextResponse.json({ success: true }, { status: 200 });
}
