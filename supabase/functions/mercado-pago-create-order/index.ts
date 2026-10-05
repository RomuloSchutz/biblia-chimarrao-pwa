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

  // Compatibilidade com a função book-epub-access já estável no mesmo projeto:
  // com verify_jwt=false, o JWT do usuário pode vir no corpo. Assim evitamos que
  // a camada de gateway intercepte o Authorization antes do runtime da função.
  const header = req.headers.get("Authorization") ?? "";
  const token = String(body?.access_token || (header.startsWith("Bearer ") ? header.slice(7) : ""));
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

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: product, error: productError } = await admin.from("commercial_products")
    .select("code,title,product_type,amount_cents,currency,edition_id,is_active")
    .eq("code", productCode).maybeSingle();
  if (productError || !product) return json({ error: "product_not_found" }, 404);
  if (!product.is_active) return json({ error: "product_not_active" }, 409);

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
  const termsHash = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
  const { error: acceptanceError } = await admin.from("digital_purchase_acceptances").insert({
    user_id: user.id, order_id: order.id, edition_id: product.edition_id, product_code: product.code,
    terms_version: termsVersion, terms_text_hash: termsHash,
  });
  if (acceptanceError) {
    await admin.from("orders").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", order.id);
    return json({ error: "acceptance_record_failed" }, 500);
  }

  const amount = (Number(product.amount_cents) / 100).toFixed(2);
  const mpPayload: any = {
    type: "online", processing_mode: "manual", total_amount: amount, external_reference: order.id,
    payer: { email: user.email },
    items: [{ title: product.title, unit_price: amount, quantity: 1, unit_measure: "unit", total_amount: amount }],
  };

  const baseUrl = String(body?.return_base_url ?? "").trim();
  if (baseUrl) {
    try {
      const u = new URL(baseUrl);
      if (u.protocol !== "https:") throw new Error("https_required");
      const root = u.origin;
      mpPayload.config = { online: {
        success_url: `${root}/?payment=success`, failure_url: `${root}/?payment=failure`,
        pending_url: `${root}/?payment=pending`, auto_return: "approved",
      }};
    } catch { return json({ error: "invalid_return_base_url" }, 400); }
  }

  let mpResponse: Response;
  try {
    mpResponse = await fetch("https://api.mercadopago.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mercadoPagoAccessToken}`,
        "X-Idempotency-Key": order.id,
      },
      body: JSON.stringify(mpPayload),
    });
  } catch {
    await admin.from("orders").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", order.id);
    return json({ error: "mercado_pago_connection_failed" }, 502);
  }

  let mp: any = {};
  try { mp = await mpResponse.json(); } catch {}
  if (!mpResponse.ok || !mp?.id || !mp?.checkout_url) {
    await admin.from("orders").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", order.id);
    return json({
      error: "mercado_pago_order_failed",
      provider_status: mpResponse.status,
      provider_error: mp?.error ?? mp?.message ?? null,
      provider_details: mp?.details ?? null,
    }, 502);
  }

  const { error: updateError } = await admin.from("orders")
    .update({ provider_order_id: String(mp.id), updated_at: new Date().toISOString() }).eq("id", order.id);
  if (updateError) return json({ error: "provider_order_persist_failed" }, 500);

  return json({
    order_id: order.id, product_code: product.code, amount_cents: product.amount_cents,
    currency: product.currency, checkout_url: mp.checkout_url,
  }, 201);
});
