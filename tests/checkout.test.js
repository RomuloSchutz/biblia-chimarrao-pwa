import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

const source=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/mercado-pago-create-order/index.ts',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,''))
const validationSource=stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/validate-commercial-coupon/index.ts',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,''))
async function checkout({base='https://bibliachimarrao.com.br/loja',coupon=false,reservationError=false,provider='ok',count=0,validate=false}={}) {
  let handler,payload,calls=0
  const writes=[],filters=[]
  const product={code:'book',title:'Book',product_type:'ebook',amount_cents:2000,currency:'BRL',edition_id:'edition',is_active:true}
  const promo={id:'coupon',code:'PROMO',discount_type:'percent',discount_percent:10,is_active:true,max_redemptions:1,max_redemptions_per_user:1}
  const db={auth:{getUser:async()=>({data:{user:{id:'user'}},error:null})},from(table){let op='select',value;const chain={
    select(){return chain},eq(){return chain},in(key,values){filters.push({table,key,values});return chain},
    insert(v){op='insert';value=v;return chain},update(v){op='update';value=v;return chain},
    maybeSingle(){return Promise.resolve({data:table==='commercial_products'?product:table==='commercial_coupons'?promo:{coupon_id:'coupon'},error:null})},
    single(){writes.push({table,op,value});return Promise.resolve({data:{id:'order'},error:null})},
    then(resolve,reject){writes.push({table,op,value});return Promise.resolve({count,error:table==='commercial_coupon_redemptions'&&op==='insert'&&reservationError?{code:'P0001'}:null}).then(resolve,reject)}
  };return chain}}
  const env={SUPABASE_URL:'https://example.test',SUPABASE_ANON_KEY:'test',SUPABASE_SERVICE_ROLE_KEY:'test',MERCADO_PAGO_ACCESS_TOKEN:'test'}
  new Function('Deno','createClient','fetch',validate?validationSource:source)({env:{get:k=>env[k]},serve:f=>handler=f},()=>db,async(url,options)=>{
    calls++;payload=JSON.parse(options.body)
    if(provider==='timeout')throw new Error('lost response')
    if(provider==='500')return Response.json({error:'unavailable'},{status:500})
    if(['408','409','429'].includes(provider))return Response.json({error:'uncertain'},{status:Number(provider)})
    if(provider==='invalid')return Response.json({id:'provider-order'})
    if(provider==='400')return Response.json({error:'invalid'},{status:400})
    return Response.json({id:'provider-order',checkout_url:'https://example.test/pay'})
  })
  const response=await handler(new Request('https://example.test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({access_token:'test',product_code:'book',accepted:true,return_base_url:base,coupon_code:coupon?'PROMO':''})}))
  return {status:response.status,body:await response.json(),payload,writes,filters,calls}
}
for(const base of ['https://bibliachimarrao.com.br/loja','https://bibliachimarrao.com.br/loja/','https://biblia-chimarrao-pwa.rommar2179.workers.dev','https://biblia-chimarrao-site.pages.dev/loja'])test(`sets trusted checkout returns for ${base}`,async()=>{
  const r=await checkout({base});assert.equal(r.status,201)
  for(const state of ['success','pending','failure'])assert.equal(r.payload.config.online[`${state}_url`],`${base.replace(/\/$/,'')}/?payment_return=${state}&local_order=order`)
})
for(const base of ['https://evil.test/loja','https://bibliachimarrao.com.br.evil.test/loja','https://bibliachimarrao.com.br/loja?next=https://evil.test','http://bibliachimarrao.com.br/loja'])test(`does not trust return ${base}`,async()=>{assert.equal((await checkout({base})).payload.config,undefined)})
test('counts pending reservations and stops before contacting the provider on quota denial',async()=>{
  const r=await checkout({coupon:true,reservationError:true});assert.equal(r.status,409);assert.equal(r.calls,0)
  assert.equal(r.filters.length,2);for(const filter of r.filters)assert.deepEqual(filter.values,['pending','redeemed'])
})
test('exhausted preflight quota creates no order',async()=>{const r=await checkout({coupon:true,count:1});assert.equal(r.status,409);assert.equal(r.writes.some(x=>x.op==='insert'),false);assert.equal(r.calls,0)})
for(const provider of ['timeout','500','408','409','429','invalid'])test(`keeps coupon reserved when provider outcome is uncertain: ${provider}`,async()=>{
  const r=await checkout({coupon:true,provider});assert.equal(r.status,502);assert.equal(r.body.order_id,'order')
  assert.equal(r.writes.some(x=>x.op==='update'&&['failed','cancelled'].includes(x.value.status)),false)
})
test('coupon preview also counts pending reservations without creating a checkout',async()=>{
  const r=await checkout({coupon:true,validate:true});assert.equal(r.status,200);assert.equal(r.body.amount_cents,1800);assert.equal(r.calls,0)
  assert.equal(r.filters.length,2);for(const filter of r.filters)assert.deepEqual(filter.values,['pending','redeemed'])
})
test('coupon preview rejects exhausted reservations',async()=>{assert.equal((await checkout({coupon:true,validate:true,count:1})).status,409)})
test('releases coupon on definitive provider rejection',async()=>{
  const r=await checkout({coupon:true,provider:'400'});assert.equal(r.status,502)
  assert.ok(r.writes.some(x=>x.table==='commercial_coupon_redemptions'&&x.op==='update'&&x.value.status==='cancelled'))
})
