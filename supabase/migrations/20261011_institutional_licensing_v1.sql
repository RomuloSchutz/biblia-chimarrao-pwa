-- Institutional licensing v1
-- Applied to Supabase production on 2026-10-11 as an additive migration.

create table if not exists public.institutional_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'empresa' check (kind in ('empresa','prefeitura','igreja','livraria','associacao','outro')),
  contact_name text,
  contact_email text,
  contact_phone text,
  status text not null default 'active' check (status in ('active','blocked')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.institutional_license_lots (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutional_accounts(id) on delete cascade,
  annual_edition_id uuid not null references public.app_annual_editions(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  source text not null default 'manual' check (source in ('manual','pix','transferencia','boleto','empenho','mercado_pago','cortesia','outro')),
  reference text,
  amount_cents integer check (amount_cents is null or amount_cents >= 0),
  purchased_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.institutional_activation_codes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutional_accounts(id) on delete cascade,
  annual_edition_id uuid not null references public.app_annual_editions(id) on delete restrict,
  label text,
  code text not null unique,
  status text not null default 'active' check (status in ('active','blocked')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.institutional_activations (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutional_accounts(id) on delete cascade,
  annual_edition_id uuid not null references public.app_annual_editions(id) on delete restrict,
  activation_code_id uuid references public.institutional_activation_codes(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  activated_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  notes text
);

create index if not exists institutional_license_lots_lookup_idx
  on public.institutional_license_lots (institution_id, annual_edition_id, purchased_at desc);
create index if not exists institutional_activations_lookup_idx
  on public.institutional_activations (institution_id, annual_edition_id, activated_at desc);
create unique index if not exists institutional_activations_active_user_edition_uidx
  on public.institutional_activations (user_id, annual_edition_id)
  where revoked_at is null;

alter table public.institutional_accounts enable row level security;
alter table public.institutional_license_lots enable row level security;
alter table public.institutional_activation_codes enable row level security;
alter table public.institutional_activations enable row level security;

drop policy if exists institutional_accounts_admin_all on public.institutional_accounts;
create policy institutional_accounts_admin_all on public.institutional_accounts for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
drop policy if exists institutional_license_lots_admin_all on public.institutional_license_lots;
create policy institutional_license_lots_admin_all on public.institutional_license_lots for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
drop policy if exists institutional_activation_codes_admin_all on public.institutional_activation_codes;
create policy institutional_activation_codes_admin_all on public.institutional_activation_codes for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
drop policy if exists institutional_activations_admin_all on public.institutional_activations;
create policy institutional_activations_admin_all on public.institutional_activations for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());
drop policy if exists institutional_activations_user_read_own on public.institutional_activations;
create policy institutional_activations_user_read_own on public.institutional_activations for select to authenticated using (user_id = auth.uid() or public.is_app_admin());

create or replace function public.admin_issue_institutional_code(
  p_institution_id uuid,
  p_annual_edition_id uuid,
  p_label text default null,
  p_expires_at timestamptz default null
) returns text language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if not public.is_app_admin() then raise exception 'admin_required'; end if;
  if not exists (select 1 from public.institutional_accounts where id=p_institution_id) then raise exception 'institution_not_found'; end if;
  if not exists (select 1 from public.app_annual_editions where id=p_annual_edition_id) then raise exception 'annual_edition_not_found'; end if;
  loop
    v_code := 'BC-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,4)) || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,4));
    exit when not exists (select 1 from public.institutional_activation_codes where code=v_code);
  end loop;
  insert into public.institutional_activation_codes(institution_id,annual_edition_id,label,code,expires_at,created_by)
  values(p_institution_id,p_annual_edition_id,nullif(trim(p_label),''),v_code,p_expires_at,auth.uid());
  return v_code;
end; $$;

create or replace function public.redeem_institutional_code(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_code public.institutional_activation_codes%rowtype;
  v_inst public.institutional_accounts%rowtype;
  v_edition public.app_annual_editions%rowtype;
  v_purchased integer := 0;
  v_used integer := 0;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  select * into v_code from public.institutional_activation_codes where upper(code)=upper(trim(p_code)) for update;
  if not found then raise exception 'invalid_code'; end if;
  select * into v_inst from public.institutional_accounts where id=v_code.institution_id for update;
  select * into v_edition from public.app_annual_editions where id=v_code.annual_edition_id;
  if v_inst.status<>'active' then raise exception 'institution_blocked'; end if;
  if v_code.status<>'active' then raise exception 'code_blocked'; end if;
  if v_code.expires_at is not null and v_code.expires_at<now() then raise exception 'code_expired'; end if;
  if not coalesce(v_edition.is_active,false) then raise exception 'edition_inactive'; end if;

  if exists(select 1 from public.institutional_activations where user_id=v_uid and institution_id=v_inst.id and annual_edition_id=v_edition.id and revoked_at is null) then
    select coalesce(sum(quantity),0)::integer into v_purchased from public.institutional_license_lots where institution_id=v_inst.id and annual_edition_id=v_edition.id;
    select count(*)::integer into v_used from public.institutional_activations where institution_id=v_inst.id and annual_edition_id=v_edition.id and revoked_at is null;
    return jsonb_build_object('status','already_activated','institution_id',v_inst.id,'institution_name',v_inst.name,'year',v_edition.year,'remaining',greatest(v_purchased-v_used,0));
  end if;

  if exists(select 1 from public.user_annual_editions where user_id=v_uid and annual_edition_id=v_edition.id and revoked_at is null) then
    return jsonb_build_object('status','already_has_access','institution_id',v_inst.id,'institution_name',v_inst.name,'year',v_edition.year);
  end if;

  select coalesce(sum(quantity),0)::integer into v_purchased from public.institutional_license_lots where institution_id=v_inst.id and annual_edition_id=v_edition.id;
  select count(*)::integer into v_used from public.institutional_activations where institution_id=v_inst.id and annual_edition_id=v_edition.id and revoked_at is null;
  if v_purchased<=v_used then raise exception 'no_available_seats'; end if;

  insert into public.institutional_activations(institution_id,annual_edition_id,activation_code_id,user_id)
  values(v_inst.id,v_edition.id,v_code.id,v_uid);

  insert into public.user_annual_editions(user_id,annual_edition_id,source,granted_at,revoked_at)
  values(v_uid,v_edition.id,'corporate',now(),null)
  on conflict (user_id,annual_edition_id,source) where source<>'purchase' and order_reference is null
  do update set granted_at=excluded.granted_at,revoked_at=null;

  return jsonb_build_object('status','activated','institution_id',v_inst.id,'institution_name',v_inst.name,'year',v_edition.year,'remaining',greatest(v_purchased-v_used-1,0));
end; $$;

create or replace function public.admin_revoke_institutional_activation(p_activation_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_activation public.institutional_activations%rowtype;
begin
  if not public.is_app_admin() then raise exception 'admin_required'; end if;
  select * into v_activation from public.institutional_activations where id=p_activation_id for update;
  if not found then raise exception 'activation_not_found'; end if;
  if v_activation.revoked_at is null then
    update public.institutional_activations set revoked_at=now(),revoked_by=auth.uid() where id=p_activation_id;
    update public.user_annual_editions set revoked_at=now() where user_id=v_activation.user_id and annual_edition_id=v_activation.annual_edition_id and source='corporate' and revoked_at is null;
  end if;
  return true;
end; $$;

create or replace view public.institutional_license_summary with (security_invoker=true) as
select ia.id institution_id,ia.name institution_name,ia.kind,ia.status institution_status,
       ae.id annual_edition_id,ae.year,ae.title annual_edition_title,
       coalesce((select sum(l.quantity)::integer from public.institutional_license_lots l where l.institution_id=ia.id and l.annual_edition_id=ae.id),0) purchased,
       coalesce((select count(*)::integer from public.institutional_activations a where a.institution_id=ia.id and a.annual_edition_id=ae.id and a.revoked_at is null),0) activated,
       greatest(coalesce((select sum(l.quantity)::integer from public.institutional_license_lots l where l.institution_id=ia.id and l.annual_edition_id=ae.id),0)-coalesce((select count(*)::integer from public.institutional_activations a where a.institution_id=ia.id and a.annual_edition_id=ae.id and a.revoked_at is null),0),0) available,
       (select max(l.purchased_at) from public.institutional_license_lots l where l.institution_id=ia.id and l.annual_edition_id=ae.id) last_purchase_at
from public.institutional_accounts ia cross join public.app_annual_editions ae
where exists(select 1 from public.institutional_license_lots l where l.institution_id=ia.id and l.annual_edition_id=ae.id);

grant select,insert,update,delete on public.institutional_accounts to authenticated;
grant select,insert,update,delete on public.institutional_license_lots to authenticated;
grant select,insert,update,delete on public.institutional_activation_codes to authenticated;
grant select,insert,update,delete on public.institutional_activations to authenticated;
grant select on public.institutional_license_summary to authenticated;
grant execute on function public.admin_issue_institutional_code(uuid,uuid,text,timestamptz) to authenticated;
grant execute on function public.redeem_institutional_code(text) to authenticated;
grant execute on function public.admin_revoke_institutional_activation(uuid) to authenticated;
