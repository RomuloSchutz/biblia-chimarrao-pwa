import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import pg from 'pg'

// Intentionally restricted to an empty, dedicated local test database.
const url=new URL(process.env.PG_TEST_URL||'postgres://postgres:postgres@127.0.0.1:5432/bc_coupon_quota_test')
if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||url.pathname!=='/bc_coupon_quota_test')throw new Error('Use a local bc_coupon_quota_test database only')
const connect=async()=>{const client=new pg.Client({connectionString:url.href});await client.connect();return client}
const migration=fs.readFileSync(new URL('../supabase/migrations/20261104220124_enforce_coupon_reservation_quota.sql',import.meta.url),'utf8')

test('coupon quota in PostgreSQL',async t=>{
  const db=await connect()
  const existing=await db.query("select to_regclass('public.commercial_coupons') as coupons")
  assert.equal(existing.rows[0].coupons,null,'Test database must be empty')
  await db.query(`do $$begin if not exists(select from pg_roles where rolname='anon') then create role anon; end if; if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if; end$$;
    create table public.commercial_coupons(id uuid primary key,max_redemptions integer,max_redemptions_per_user integer);
    create table public.commercial_coupon_redemptions(id uuid primary key default gen_random_uuid(),coupon_id uuid references public.commercial_coupons(id),user_id uuid,status text not null);`)
  try {
    await db.query(migration)
    const coupon=async(globalLimit,userLimit)=>{const id=randomUUID();await db.query('insert into public.commercial_coupons values($1,$2,$3)',[id,globalLimit,userLimit]);return id}
    const reserve=(client,id,user=randomUUID())=>client.query("insert into public.commercial_coupon_redemptions(coupon_id,user_id,status) values($1,$2,'pending') returning id",[id,user])
    // Keep the contending insert pending until the first transaction completes.
    for(const mode of ['global','per-user','rollback'])await t.test(`serializes concurrent reservations: ${mode}`,async()=>{
      const id=await coupon(mode==='per-user'?null:1,mode==='per-user'?1:null),user=randomUUID(),a=await connect(),b=await connect()
      try {
        await a.query('begin');await reserve(a,id,user)
        const pending=reserve(b,id,mode==='per-user'?user:randomUUID()).then(result=>({result}),error=>({error}))
        let blocked=false
        for(let i=0;i<100;i++){
          const state=await db.query("select wait_event_type from pg_stat_activity where pid=$1",[b.processID])
          if(state.rows[0]?.wait_event_type==='Lock'){blocked=true;break}
          await new Promise(resolve=>setTimeout(resolve,20))
        }
        assert.equal(blocked,true,'Second connection must wait on coupon lock')
        await a.query(mode==='rollback'?'rollback':'commit')
        const outcome=await pending
        if(mode==='rollback')assert.ok(outcome.result)
        else {assert.equal(outcome.error?.code,'P0001');assert.match(outcome.error.message,/coupon_(user_)?usage_limit_reached|coupon_user_limit_reached/)}
        assert.equal(Number((await db.query('select count(*) from public.commercial_coupon_redemptions where coupon_id=$1',[id])).rows[0].count),1)
      } finally {await a.query('rollback');await a.end();await b.end()}
    })
    await t.test('paid finalization is idempotent and keeps quota occupied',async()=>{
      const id=await coupon(1,null);const r=await reserve(db,id)
      for(let i=0;i<2;i++)await db.query("update public.commercial_coupon_redemptions set status='redeemed' where id=$1",[r.rows[0].id])
      await assert.rejects(reserve(db,id),{code:'P0001'})
    })
    for(const status of ['cancelled','refunded'])await t.test(`${status} releases the reservation`,async()=>{
      const id=await coupon(1,null);await reserve(db,id)
      await db.query('update public.commercial_coupon_redemptions set status=$1 where coupon_id=$2',[status,id]);await reserve(db,id)
    })
    await t.test('different coupons reserve independently',async()=>{
      const a=await connect();try {await a.query('begin');await reserve(a,await coupon(1,null));await reserve(db,await coupon(1,null))}finally{await a.query('rollback');await a.end()}
    })
    await t.test('trigger is invoker and not callable by frontend roles',async()=>{
      const r=await db.query("select prosecdef,has_function_privilege('anon',oid,'EXECUTE') as anon,has_function_privilege('authenticated',oid,'EXECUTE') as authenticated from pg_proc where oid='public.enforce_coupon_reservation_quota()'::regprocedure")
      assert.deepEqual(r.rows[0],{prosecdef:false,anon:false,authenticated:false})
    })
  } finally {await db.query('drop table public.commercial_coupon_redemptions; drop table public.commercial_coupons; drop function public.enforce_coupon_reservation_quota()');await db.end()}
})
