import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"content-type":"application/json; charset=utf-8"}});
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({error:"method_not_allowed"},405);
 let body:any={};try{body=await req.json()}catch{return json({error:"invalid_json"},400)}
 const base=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 const authorization=req.headers.get("Authorization")??"";const token=String(body?.access_token||(authorization.startsWith("Bearer ")?authorization.slice(7):""));
 if(!token)return json({error:"unauthorized"},401);
 const auth=createClient(base,anon,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});const {data:{user},error:ue}=await auth.auth.getUser(token);if(ue||!user)return json({error:"unauthorized"},401);
 const productCode=String(body?.product_code??"").trim(),couponCode=String(body?.coupon_code??"").trim().toUpperCase();if(!productCode)return json({error:"product_code_required"},400);if(!couponCode)return json({error:"coupon_code_required"},400);
 const db=createClient(base,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:p,error:pe}=await db.from("commercial_products").select("code,amount_cents,currency,is_active").eq("code",productCode).maybeSingle();if(pe||!p)return json({error:"product_not_found"},404);if(!p.is_active)return json({error:"product_not_active"},409);
 const {data:c,error:ce}=await db.from("commercial_coupons").select("id,code,discount_type,discount_percent,discount_amount_cents,starts_at,ends_at,is_active,max_redemptions,max_redemptions_per_user,min_purchase_cents").eq("code",couponCode).maybeSingle();if(ce)return json({error:"coupon_validation_failed"},500);if(!c)return json({error:"coupon_invalid"},409);if(!c.is_active)return json({error:"coupon_inactive"},409);
 const now=Date.now();if(c.starts_at&&now<new Date(c.starts_at).getTime())return json({error:"coupon_not_started"},409);if(c.ends_at&&now>new Date(c.ends_at).getTime())return json({error:"coupon_expired"},409);if(Number(c.min_purchase_cents||0)>Number(p.amount_cents))return json({error:"coupon_minimum_not_met",minimum_cents:Number(c.min_purchase_cents)},409);
 const {data:m,error:me}=await db.from("commercial_coupon_products").select("coupon_id").eq("coupon_id",c.id).eq("product_code",p.code).maybeSingle();if(me)return json({error:"coupon_product_validation_failed"},500);if(!m)return json({error:"coupon_not_applicable"},409);
 if(c.max_redemptions!=null){const {count,error}=await db.from("commercial_coupon_redemptions").select("id",{count:"exact",head:true}).eq("coupon_id",c.id).in("status",["pending","redeemed"]);if(error)return json({error:"coupon_usage_validation_failed"},500);if((count??0)>=Number(c.max_redemptions))return json({error:"coupon_usage_limit_reached"},409)}
 if(c.max_redemptions_per_user!=null){const {count,error}=await db.from("commercial_coupon_redemptions").select("id",{count:"exact",head:true}).eq("coupon_id",c.id).eq("user_id",user.id).in("status",["pending","redeemed"]);if(error)return json({error:"coupon_user_usage_validation_failed"},500);if((count??0)>=Number(c.max_redemptions_per_user))return json({error:"coupon_user_limit_reached"},409)}
 const original=Number(p.amount_cents);let discount=0;if(c.discount_type==="percent")discount=Math.floor(original*Number(c.discount_percent)/100);else if(c.discount_type==="fixed")discount=Number(c.discount_amount_cents||0);else return json({error:"coupon_configuration_invalid"},500);discount=Math.max(0,Math.min(discount,original-1));if(discount<=0)return json({error:"coupon_configuration_invalid"},500);
 return json({valid:true,coupon_code:c.code,product_code:p.code,original_amount_cents:original,discount_amount_cents:discount,amount_cents:original-discount,currency:p.currency});
});
