import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json; charset=utf-8" } });
function safeProviderError(value: unknown) {
  if (!value || typeof value !== "object") return value ?? null;
  const source = value as Record<string, unknown>;
  const allowed = ["error","message","code","status","status_detail","cause","details"];
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
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: userError } = await userClient.auth.getUser(token);
  if (userError || !user) return json({ error: "unauthorized", stage: "get_user" }, 401);
  const productCode = String(body?.product_code ?? "").trim();
  if (!productCode) return json({ error: "product_code_required" }, 400);
  if (body?.accepted !== true) return json({ error: "purchase_terms_acceptance_required" }, 400);
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: product, error: productError } = await admin.from("commercial_products").select("code,title,product_type,amount_cents,currency,edition_id,is_active").eq("code", productCode).maybeSingle();
  if (productError || !product) return json({ error: "product_not_found" }, 404);
  if (!product.is_active) return json({ error: "product_not_active" }, 409);
  if (product.currency !== "BRL" || !Number.isInteger(product.amount_cents) || product.amount_cents <= 0) return json({ error: "invalid_product_commercial_data" }, 500);

  const originalAmountCents = Number(product.amount_cents);
  let finalAmountCents = originalAmountCents;
  let discountAmountCents = 0;
  let appliedCoupon: any = null;
  const couponCode = String(body?.coupon_code ?? "").trim().toUpperCase();
  if (couponCode) {
    const now = new Date().toISOString();
    const { data: coupon, error: couponError } = await admin.from("commercial_coupons")
      .select("id,code,discount_type,discount_percent,discount_amount_cents,starts_at,ends_at,is_active,max_redemptions,max_redemptions_per_user,min_purchase_cents")
      .eq("code", couponCode).maybeSingle();
    if (couponError) return json({ error: "coupon_validation_failed" }, 500);
    if (!coupon) return json({ error: "coupon_invalid" }, 409);
    if (!coupon.is_active) return json({ error: "coupon_inactive" }, 409);
    if (coupon.starts_at && now < coupon.starts_at) return json({ error: "coupon_not_started" }, 409);
    if (coupon.ends_at && now > coupon.ends_at) return json({ error: "coupon_expired" }, 409);
    if (Number(coupon.min_purchase_cents || 0) > originalAmountCents) return json({ error: "coupon_minimum_not_met", minimum_cents: Number(coupon.min_purchase_cents) }, 409);
    const { data: mapping, error: mappingError } = await admin.from("commercial_coupon_products").select("coupon_id").eq("coupon_id", coupon.id).eq("product_code", product.code).maybeSingle();
    if (mappingError) return json({ error: "coupon_product_validation_failed" }, 500);
    if (!mapping) return json({ error: "coupon_not_applicable" }, 409);
    if (coupon.max_redemptions != null) {
      const { count, error } = await admin.from("commercial_coupon_redemptions").select("id", { count: "exact", head: true }).eq("coupon_id", coupon.id).in("status", ["pending", "redeemed"]);
      if (error) return json({ error: "coupon_usage_validation_failed" }, 500);
      if ((count ?? 0) >= Number(coupon.max_redemptions)) return json({ error: "coupon_usage_limit_reached" }, 409);
    }
    if (coupon.max_redemptions_per_user != null) {
      const { count, error } = await admin.from("commercial_coupon_redemptions").select("id", { count: "exact", head: true }).eq("coupon_id", coupon.id).eq("user_id", user.id).in("status", ["pending", "redeemed"]);
      if (error) return json({ error: "coupon_user_usage_validation_failed" }, 500);
      if ((count ?? 0) >= Number(coupon.max_redemptions_per_user)) return json({ error: "coupon_user_limit_reached" }, 409);
    }
    if (coupon.discount_type === "percent") discountAmountCents = Math.floor(originalAmountCents * Number(coupon.discount_percent) / 100);
    else if (coupon.discount_type === "fixed") discountAmountCents = Number(coupon.discount_amount_cents || 0);
    else return json({ error: "coupon_configuration_invalid" }, 500);
    discountAmountCents = Math.max(0, Math.min(discountAmountCents, originalAmountCents - 1));
    if (discountAmountCents <= 0) return json({ error: "coupon_configuration_invalid" }, 500);
    finalAmountCents = originalAmountCents - discountAmountCents;
    appliedCoupon = coupon;
  }

  const currentTermsVersion = "08/10/2026";
  const legacyTermsVersion = "04/10/2026";
  const policyVersion = String(body?.policy_version ?? "").trim();
  const licenseVersion = String(body?.license_version ?? "").trim();
  const isAnnualAppAccess = product.product_type === "app_access";
  const suppliedVersions = Boolean(policyVersion || licenseVersion);
  if (isAnnualAppAccess && (policyVersion !== currentTermsVersion || licenseVersion !== currentTermsVersion)) return json({ error: "purchase_terms_version_mismatch", expected_version: currentTermsVersion }, 409);
  if (!isAnnualAppAccess && suppliedVersions && (policyVersion !== currentTermsVersion || licenseVersion !== currentTermsVersion)) return json({ error: "purchase_terms_version_mismatch", expected_version: currentTermsVersion }, 409);
  const termsVersion = (isAnnualAppAccess || suppliedVersions) ? currentTermsVersion : legacyTermsVersion;
  const canonicalTerms = termsVersion === currentTermsVersion ? "Politica de Compra Digital e Licenca Digital Biblia + Chimarrao | versao 08/10/2026" : "Politica de Compra Digital e Licenca Digital Biblia + Chimarrao | versao 04/10/2026";

  const { data: order, error: orderError } = await admin.from("orders").insert({ user_id:user.id, edition_id:product.edition_id, product_code:product.code, status:"pending", amount_cents:finalAmountCents, currency:product.currency, payment_provider:"mercado_pago", original_amount_cents:originalAmountCents, discount_amount_cents:discountAmountCents, coupon_code:appliedCoupon?.code ?? null, coupon_id:appliedCoupon?.id ?? null }).select("id").single();
  if (orderError || !order) return json({ error: "local_order_creation_failed" }, 500);
  if (appliedCoupon) {
    const { error: redemptionError } = await admin.from("commercial_coupon_redemptions").insert({ coupon_id:appliedCoupon.id, user_id:user.id, order_id:order.id, product_code:product.code, original_amount_cents:originalAmountCents, discount_amount_cents:discountAmountCents, final_amount_cents:finalAmountCents, status:"pending" });
    if (redemptionError) { await admin.from("orders").update({status:"failed",updated_at:new Date().toISOString()}).eq("id",order.id); return json({error:"coupon_reservation_failed"},409); }
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalTerms));
  const termsHash = [...new Uint8Array(digest)].map((b)=>b.toString(16).padStart(2,"0")).join("");
  const { error: acceptanceError } = await admin.from("digital_purchase_acceptances").insert({ user_id:user.id, order_id:order.id, edition_id:product.edition_id, product_code:product.code, terms_version:termsVersion, terms_text_hash:termsHash });
  if (acceptanceError) { await admin.from("orders").update({status:"failed",updated_at:new Date().toISOString()}).eq("id",order.id); if(appliedCoupon) await admin.from("commercial_coupon_redemptions").update({status:"cancelled"}).eq("order_id",order.id); return json({error:"acceptance_record_failed"},500); }

  const amount=(finalAmountCents/100).toFixed(2);
  const mpPayload:any={ type:"online", processing_mode:"manual", total_amount:amount, external_reference:order.id, description:product.title, items:[{external_code:product.code,title:product.title,quantity:1,unit_price:amount}] };
  const requestedReturnBase=String(body?.return_base_url??"").replace(/\/$/,"");
  const allowedReturnBases=new Set(["https://lab-politica-compra-anual-2026-10-07-biblia-chimarrao-pwa.rommar2179.workers.dev","https://biblia-chimarrao-pwa.rommar2179.workers.dev","https://biblia-chimarrao-site.pages.dev/loja","https://bibliachimarrao.com.br/loja"]);
  if (requestedReturnBase && allowedReturnBases.has(requestedReturnBase)) mpPayload.config={online:{success_url:`${requestedReturnBase}/?payment_return=success&local_order=${order.id}`,pending_url:`${requestedReturnBase}/?payment_return=pending&local_order=${order.id}`,failure_url:`${requestedReturnBase}/?payment_return=failure&local_order=${order.id}`,auto_return:"all"}};
  let mpResponse:Response; let raw="";
  try { mpResponse=await fetch("https://api.mercadopago.com/v1/orders",{method:"POST",headers:{"Accept":"application/json","Content-Type":"application/json","Authorization":`Bearer ${mercadoPagoAccessToken}`,"X-Idempotency-Key":order.id},body:JSON.stringify(mpPayload)}); raw=await mpResponse.text(); }
  // A lost response can follow successful creation at the provider. Keep the
  // reservation until the signed webhook/reconciliation establishes its state.
  catch { return json({error:"mercado_pago_connection_failed",order_id:order.id},502); }
  let mp:any=null; try{mp=raw?JSON.parse(raw):null}catch{mp=null}
  if(mpResponse.status>=500||[408,409,429].includes(mpResponse.status))return json({error:"mercado_pago_order_failed",order_id:order.id,provider_status:mpResponse.status},502);
  if(!mpResponse.ok){await admin.from("orders").update({status:"failed",updated_at:new Date().toISOString()}).eq("id",order.id);if(appliedCoupon) await admin.from("commercial_coupon_redemptions").update({status:"cancelled"}).eq("order_id",order.id);const diagnostic=safeProviderError(mp);console.error("Mercado Pago create order rejected",{provider_status:mpResponse.status,provider_error:diagnostic,provider_content_type:mpResponse.headers.get("content-type"),provider_raw_length:raw.length,provider_raw_preview:raw.slice(0,1000)});return json({error:"mercado_pago_order_failed",provider_status:mpResponse.status,provider_error:diagnostic,provider_details:diagnostic},502);}
  if(!mp?.id||!mp?.checkout_url){return json({error:"mercado_pago_invalid_success_response",order_id:order.id,provider_status:mpResponse.status,provider_error:safeProviderError(mp)},502);}
  const {error:updateError}=await admin.from("orders").update({provider_order_id:String(mp.id),checkout_url:String(mp.checkout_url),updated_at:new Date().toISOString()}).eq("id",order.id);
  if(updateError)return json({error:"provider_order_persist_failed"},500);
  return json({order_id:order.id,product_code:product.code,original_amount_cents:originalAmountCents,discount_amount_cents:discountAmountCents,amount_cents:finalAmountCents,currency:product.currency,coupon_code:appliedCoupon?.code ?? null,checkout_url:mp.checkout_url},201);
});
