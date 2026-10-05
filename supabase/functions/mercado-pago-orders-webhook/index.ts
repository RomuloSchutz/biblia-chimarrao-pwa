import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" },
});

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function validateSignature(req: Request, dataId: string) {
  const secret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");
  if (!secret) return { ok: false, reason: "webhook_secret_not_configured" };
  const signature = req.headers.get("x-signature") ?? "";
  const requestId = req.headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(signature.split(",").map((p) => p.trim().split("=", 2)));
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return { ok: false, reason: "missing_signature" };
  const normalizedId = dataId.toLowerCase();
  let manifest = `id:${normalizedId};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${ts};`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  return { ok: safeEqual(hex(digest), v1.toLowerCase()), reason: "invalid_signature" };
}

function cents(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "GET") return json({ ok: true, service: "mercado-pago-orders-webhook", ready: true });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const url = new URL(req.url);
  const queryId = url.searchParams.get("data.id") ?? url.searchParams.get("data_id") ?? "";
  let payload: any = {};
  try { payload = await req.json(); } catch { /* test notification can omit JSON */ }
  const dataId = String(queryId || payload?.data?.id || "").trim();
  if (!dataId) return json({ error: "missing_data_id" }, 400);

  const validation = await validateSignature(req, dataId);
  if (!validation.ok) return json({ error: validation.reason }, validation.reason === "webhook_secret_not_configured" ? 503 : 401);

  const type = String(payload?.type ?? url.searchParams.get("type") ?? "").toLowerCase();
  if (type && !["order", "orders", "orders_v2"].includes(type)) return json({ ok: true, ignored: true });

  const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!accessToken || !supabaseUrl || !serviceKey) return json({ error: "server_not_configured" }, 503);

  const mpResponse = await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(dataId)}`, {
    headers: { "Accept": "application/json", "Authorization": `Bearer ${accessToken}` },
  });
  let mp: any = null;
  try { mp = await mpResponse.json(); } catch { /* handled below */ }
  if (!mpResponse.ok || !mp?.id) {
    console.error("Mercado Pago order lookup failed", { provider_status: mpResponse.status, code: mp?.code ?? mp?.error ?? null });
    return json({ error: "provider_order_lookup_failed", provider_status: mpResponse.status }, 502);
  }

  if (String(mp.id) !== dataId) return json({ error: "provider_order_id_mismatch" }, 409);
  const localId = String(mp.external_reference ?? "").trim();
  if (!localId) return json({ error: "missing_external_reference" }, 409);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: order, error: orderError } = await admin.from("orders")
    .select("id,user_id,edition_id,product_code,status,amount_cents,currency,payment_provider,provider_order_id,paid_at")
    .eq("id", localId).maybeSingle();
  if (orderError || !order) return json({ error: "local_order_not_found" }, 404);
  if (order.payment_provider !== "mercado_pago") return json({ error: "payment_provider_mismatch" }, 409);
  if (order.provider_order_id && String(order.provider_order_id) !== dataId) return json({ error: "local_provider_order_id_mismatch" }, 409);

  const { data: product, error: productError } = await admin.from("commercial_products")
    .select("code,product_type,amount_cents,currency,edition_id")
    .eq("code", order.product_code).maybeSingle();
  if (productError || !product) return json({ error: "commercial_product_not_found" }, 409);

  const providerAmount = cents(mp.total_amount);
  const providerPaidAmount = cents(mp.total_paid_amount);
  const providerCurrency = String(mp.currency ?? order.currency ?? "").toUpperCase();
  if (providerAmount !== order.amount_cents || product.amount_cents !== order.amount_cents) return json({ error: "amount_mismatch" }, 409);
  if (providerCurrency && providerCurrency !== order.currency) return json({ error: "currency_mismatch" }, 409);
  if (product.currency !== order.currency) return json({ error: "catalog_currency_mismatch" }, 409);
  if (product.edition_id && order.edition_id && product.edition_id !== order.edition_id) return json({ error: "edition_mismatch" }, 409);

  const providerStatus = String(mp.status ?? "").toLowerCase();
  const statusDetail = String(mp.status_detail ?? "").toLowerCase();
  const paymentId = mp?.transactions?.payments?.[0]?.id ? String(mp.transactions.payments[0].id) : null;
  const now = new Date().toISOString();

  if (providerStatus === "processed" && statusDetail === "accredited") {
    if (providerPaidAmount !== order.amount_cents) return json({ error: "paid_amount_mismatch" }, 409);
    const paidAt = order.paid_at ?? now;
    const downloadAt = product.product_type === "ebook" ? new Date(new Date(paidAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : null;
    const { error: updateError } = await admin.from("orders").update({
      status: "paid", provider_order_id: dataId, provider_payment_id: paymentId,
      paid_at: paidAt, download_available_at: downloadAt, updated_at: now,
    }).eq("id", order.id);
    if (updateError) return json({ error: "local_order_update_failed" }, 500);

    if ((product.product_type === "ebook" || product.product_type === "devotional") && product.edition_id) {
      const { error: grantError } = await admin.from("user_editions").upsert({
        user_id: order.user_id, edition_id: product.edition_id, source: "purchase",
        order_reference: order.id, granted_at: paidAt,
      }, { onConflict: "user_id,edition_id", ignoreDuplicates: true });
      if (grantError) return json({ error: "entitlement_grant_failed" }, 500);
    } else if (product.product_type === "app_access") {
      const { error: accessError } = await admin.from("app_access").upsert({
        user_id: order.user_id, status: "active", source: "mercado_pago", access_until: null,
        notes: `order:${order.id}`, updated_at: now,
      }, { onConflict: "user_id" });
      if (accessError) return json({ error: "app_access_grant_failed" }, 500);
    }
    return json({ ok: true, reconciled: "paid" });
  }

  if (providerStatus === "refunded" || statusDetail === "refunded") {
    await admin.from("orders").update({ status: "refunded", updated_at: now }).eq("id", order.id);
    return json({ ok: true, reconciled: "refunded", access_review_required: true });
  }

  if (providerStatus === "canceled") {
    await admin.from("orders").update({ status: "cancelled", updated_at: now }).eq("id", order.id);
    return json({ ok: true, reconciled: "cancelled" });
  }

  if (providerStatus === "failed") {
    await admin.from("orders").update({ status: "failed", updated_at: now }).eq("id", order.id);
    return json({ ok: true, reconciled: "failed" });
  }

  // created / processing / action_required remain pending and never grant access.
  await admin.from("orders").update({ status: "pending", provider_order_id: dataId, updated_at: now }).eq("id", order.id);
  return json({ ok: true, reconciled: "pending", provider_status: providerStatus, status_detail: statusDetail });
});
