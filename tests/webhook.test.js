import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

const source=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/mercado-pago-orders-webhook/index.ts',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,''))
async function run({status='processed',price=3990,failTable='',coupon=false}={}){
  let handler;const writes=[]
  const order={id:'order',user_id:'user',edition_id:'purchased-edition',product_code:'book',status:'pending',amount_cents:3490,currency:'BRL',payment_provider:'mercado_pago',provider_order_id:'123',paid_at:null,original_amount_cents:coupon?3990:3490,discount_amount_cents:coupon?500:0,coupon_id:coupon?'coupon':null,coupon_code:coupon?'PROMO':null}
  const db={from(table){let op='select';let payload;const chain={select(){return chain},eq(){return chain},is(){return chain},update(p){op='update';payload=p;return chain},upsert(p){op='upsert';payload=p;return chain},delete(){op='delete';return chain},maybeSingle(){return Promise.resolve({data:table==='orders'?order:{code:'book',product_type:'ebook',amount_cents:price,currency:'BRL',edition_id:'changed-catalog-edition'},error:null})},then(resolve,reject){writes.push({table,op,payload});return Promise.resolve({error:table===failTable?{code:'TEST_FAILURE'}:null}).then(resolve,reject)}};return chain}}
  const env={MERCADO_PAGO_WEBHOOK_SECRET:'test-secret',MERCADO_PAGO_ACCESS_TOKEN:'test-token',SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:'test-key'}
  const provider={id:'123',external_reference:'order',total_amount:'34.90',total_paid_amount:'34.90',currency:'BRL',status,status_detail:status==='processed'?'accredited':status}
  new Function('Deno','createClient','fetch',source)({env:{get:k=>env[k]},serve:f=>handler=f},()=>db,async()=>Response.json(provider))
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode('test-secret'),{name:'HMAC',hash:'SHA-256'},false,['sign'])
  const mac=Buffer.from(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('id:123;request-id:req;ts:1;'))).toString('hex')
  const request=new Request('https://example.test?data.id=123',{method:'POST',headers:{'x-signature':`ts=1,v1=${mac}`,'x-request-id':'req'},body:'{}'})
  const response=await handler(request)
  return {status:response.status,body:await response.json(),writes}
}
test('settles the agreed price after catalog changes and grants the purchased edition',async()=>{
  const result=await run();assert.equal(result.status,200);assert.equal(result.body.reconciled,'paid')
  assert.equal(result.writes.find(x=>x.table==='user_editions').payload.edition_id,'purchased-edition')
})
test('settles a discounted snapshot after catalog changes',async()=>{const r=await run({price:4990,coupon:true});assert.equal(r.status,200)})
test('processes refunds after catalog changes',async()=>{const r=await run({status:'refunded'});assert.equal(r.status,200);assert.ok(r.writes.some(x=>x.table==='user_editions'&&x.op==='delete'))})
for(const status of ['canceled','failed','pending'])test(`returns retryable failure if ${status} cannot be persisted`,async()=>{assert.equal((await run({status,failTable:'orders'})).status,500)})
test('returns retryable failure if coupon cancellation cannot be persisted',async()=>{assert.equal((await run({status:'canceled',coupon:true,failTable:'commercial_coupon_redemptions'})).status,500)})
