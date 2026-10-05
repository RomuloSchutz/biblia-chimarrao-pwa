import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "content-type": "application/json; charset=utf-8" },
});

function safeProviderError(value: unknown) {
  if (!value || typeof value !== "object") return value ?? null;
  const source = value as Record<string, unknown>;
  const allowed = ["error", "message", "code", "status", "status_detail", "cause", "details"];
  const clean: Record<string, unknown> = {};
  for (const key of allowed) if (source[key] !== undefined) clean[key] = source[key];
  return Object.keys(clean).length ? clean : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const mercadoPagoAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  if (!mercadoPagoAccessToken) return json({ error: "mercado_pago_not_configured" }, 503);

  const authorization = req.headers.get("Authorization") ?? "";
  const token = String(body?.access_token || (authorization.startsWith("Bearer ") ? authorization.slice(7) : ""));
  if (!token) return json({ error: "unauthorized", stage: "missing_user_token" }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser(token);
  if (userError || !user) return json({ error: "unauthorized", stage: "get_user" }, 401);

  const productCode = String(body?.product_code ?? "").trim();
  if (!productCode) return json({ error: "product_code_required" }, 400);
  if (body?.accepted !== true) return json({ error: "purchase_terms_acceptance_required" }, 400);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: product, error: productError } = await admin.from("commercial_products")
    .select("code,title,product_type,amount_cents,currency,edition_id,is_active")
    .eq("code", productCode)
    .maybeSingle();
  if (productError || !product) return json({ error: "product_not_found" }, 404);
  if (!product.is_active) return json({ error: "product_not_active" }, 409);
  if (product.currency !== "BRL" || !Number.isInteger(product.amount_cents) || product.amount_cents <= 0) {
    return json({ error: "invalid_product_commercial_data" }, 500);
  }

  const { data: order, error: orderError } = await admin.from("orders").insert({
    user_id: user.id,
    edition_id: product.edition_id,
    product_code: product.code,
    status: "pending",
    amount_cents: product.amount_cents,
    currency: product.currency,
    payment_provider: "mercado_pago",
  }).select("id").single();
  if (orderError || !order) return json({ error: "local_order_creation_failed" }, 500);

  const termsVersion = "04/10/2026";
  const canonicalTerms = "Politica de Compra Digital e Licenca Digital Biblia + Chimarrao | versao 04/10/2026";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalTerms));
  const termsHash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");

  const { error: acceptanceError } = await admin.from("digital_purchase_acceptances").insert({
    user_id: user.id,
    order_id: order.id,
    edition_id: product.edition_id,
    product_code: product.code,
    terms_version: termsVersion,
    terms_text_hash: termsHash,
  });
  if (acceptanceError) {
    await admin.from("orders").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", order.id);
    return json({ error: "acceptance_record_failed" }, 500);
  }

  const amount = (product.amount_cents / 100).toFixed(2);
  const mpPayload = {
    type: "online",
    processing_mode: "manual",
    total_amount: amount,
    external_reference: order.id,
  };

  let mpResponse: Response;
  let raw = "";
  try {
    mpResponse = await fetch("https://api.mercadopago.com/v1/orders", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mercadoPagoAccessToken}`,
        "X-Idempotency-Key": order.id,
      },
      body: JSON.stringify(mpPayload),
    });
    raw = await mpResponse.text();
  } catch {
    await admin.from("orders").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", order.id);
    return json({ error: "mercado_pago_connection_failed" }, 502);
  }

  let mp: any = null;
  try { mp = raw ? JSON.parse(raw) : null; } catch { mp = null; }

  if (!mpResponse.ok) {
    await admin.from("orders").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", order.id);
    const diagnostic = safeProviderError(mp);
    console.error("Mercado Pago create order rejected", {
      provider_status: mpResponse.status,
      provider_error: diagnostic,
    });
    return json({
      error: "mercado_pago_order_failed",
      provider_status: mpResponse.status,
      provider_error: diagnostic,
      provider_details: diagnostic,
    }, 502);
  }

  if (!mp?.id || !mp?.checkout_url) {
    await admin.from("orders").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", order.id);
    return json({
      error: "mercado_pago_invalid_success_response",
      provider_status: mpResponse.status,
      provider_error: safeProviderError(mp),
    }, 502);
  }

  const { error: updateError } = await admin.from("orders")
    .update({
      provider_order_id: String(mp.id),
      checkout_url: String(mp.checkout_url),
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);
  if (updateError) return json({ error: "provider_order_persist_failed" }, 500);

  return json({
    order_id: order.id,
    product_code: product.code,
    amount_cents: product.amount_cents,
    currency: product.currency,
    checkout_url: mp.checkout_url,
  }, 201);
});
