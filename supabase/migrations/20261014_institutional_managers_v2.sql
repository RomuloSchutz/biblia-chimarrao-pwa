-- Institutional licensing v2: scoped institutional managers
-- Additive migration. Preserves existing institutions, lots, codes and activations.

create table if not exists public.institutional_managers (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutional_accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','blocked')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (institution_id,user_id)
);

alter table public.institutional_managers enable row level security;

create or replace function public.is_institution_manager(p_institution_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1 from public.institutional_managers m
    where m.institution_id=p_institution_id
      and m.user_id=auth.uid()
      and m.status='active'
  )
$$;

revoke all on function public.is_institution_manager(uuid) from public, anon;
grant execute on function public.is_institution_manager(uuid) to authenticated;

drop policy if exists institutional_managers_admin_all on public.institutional_managers;
create policy institutional_managers_admin_all on public.institutional_managers
for all to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists institutional_managers_read_own on public.institutional_managers;
create policy institutional_managers_read_own on public.institutional_managers
for select to authenticated
using (user_id=auth.uid() or public.is_app_admin());

-- Managers may read only their institution. Contract/license changes remain global-admin only.
drop policy if exists institutional_accounts_manager_read on public.institutional_accounts;
create policy institutional_accounts_manager_read on public.institutional_accounts
for select to authenticated
using (public.is_institution_manager(id));

drop policy if exists institutional_license_lots_manager_read on public.institutional_license_lots;
create policy institutional_license_lots_manager_read on public.institutional_license_lots
for select to authenticated
using (public.is_institution_manager(institution_id));

drop policy if exists institutional_activation_codes_manager_read on public.institutional_activation_codes;
create policy institutional_activation_codes_manager_read on public.institutional_activation_codes
for select to authenticated
using (public.is_institution_manager(institution_id));

drop policy if exists institutional_activations_manager_read on public.institutional_activations;
create policy institutional_activations_manager_read on public.institutional_activations
for select to authenticated
using (public.is_institution_manager(institution_id));

-- Manager/admin-safe code issuance. Purchased seat quantity is not modified here.
create or replace function public.issue_institutional_code(
  p_institution_id uuid,
  p_annual_edition_id uuid,
  p_label text default null,
  p_expires_at timestamptz default null
) returns text
language plpgsql
security definer
set search_path=public
as $$
declare v_code text;
begin
  if not (public.is_app_admin() or public.is_institution_manager(p_institution_id)) then
    raise exception 'institution_manager_required';
  end if;
  if not exists(select 1 from public.institutional_accounts where id=p_institution_id and status='active') then
    raise exception 'institution_not_found_or_blocked';
  end if;
  if not exists(select 1 from public.app_annual_editions where id=p_annual_edition_id) then
    raise exception 'annual_edition_not_found';
  end if;
  if not exists(select 1 from public.institutional_license_lots where institution_id=p_institution_id and annual_edition_id=p_annual_edition_id) then
    raise exception 'institution_has_no_license_lot';
  end if;
  loop
    v_code := 'BC-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,4)) || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,4));
    exit when not exists(select 1 from public.institutional_activation_codes where code=v_code);
  end loop;
  insert into public.institutional_activation_codes(institution_id,annual_edition_id,label,code,expires_at,created_by)
  values(p_institution_id,p_annual_edition_id,nullif(trim(p_label),''),v_code,p_expires_at,auth.uid());
  return v_code;
end;
$$;

revoke all on function public.issue_institutional_code(uuid,uuid,text,timestamptz) from public, anon;
grant execute on function public.issue_institutional_code(uuid,uuid,text,timestamptz) to authenticated;

create or replace function public.set_institutional_code_status(p_code_id uuid,p_status text)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare v_inst uuid;
begin
  if p_status not in ('active','blocked') then raise exception 'invalid_status'; end if;
  select institution_id into v_inst from public.institutional_activation_codes where id=p_code_id;
  if v_inst is null then raise exception 'code_not_found'; end if;
  if not (public.is_app_admin() or public.is_institution_manager(v_inst)) then raise exception 'institution_manager_required'; end if;
  update public.institutional_activation_codes set status=p_status where id=p_code_id;
  return true;
end;
$$;

revoke all on function public.set_institutional_code_status(uuid,text) from public, anon;
grant execute on function public.set_institutional_code_status(uuid,text) to authenticated;

-- Revocation is atomic: institutional activation and corporate annual entitlement are revoked together.
create or replace function public.revoke_institutional_activation(p_activation_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare v_activation public.institutional_activations%rowtype;
begin
  select * into v_activation from public.institutional_activations where id=p_activation_id for update;
  if not found then raise exception 'activation_not_found'; end if;
  if not (public.is_app_admin() or public.is_institution_manager(v_activation.institution_id)) then
    raise exception 'institution_manager_required';
  end if;
  if v_activation.revoked_at is null then
    update public.institutional_activations
       set revoked_at=now(), revoked_by=auth.uid()
     where id=p_activation_id;
    update public.user_annual_editions
       set revoked_at=now()
     where user_id=v_activation.user_id
       and annual_edition_id=v_activation.annual_edition_id
       and source='corporate'
       and revoked_at is null;
  end if;
  return true;
end;
$$;

revoke all on function public.revoke_institutional_activation(uuid) from public, anon;
grant execute on function public.revoke_institutional_activation(uuid) to authenticated;

-- Minimal user directory for a manager: only users activated in an institution they manage.
create or replace function public.list_institutional_activation_users(p_institution_id uuid,p_annual_edition_id uuid default null)
returns table(
  activation_id uuid,
  user_id uuid,
  full_name text,
  email text,
  activated_at timestamptz,
  revoked_at timestamptz,
  status text,
  annual_edition_id uuid
)
language plpgsql
stable
security definer
set search_path=public
as $$
begin
  if not (public.is_app_admin() or public.is_institution_manager(p_institution_id)) then
    raise exception 'institution_manager_required';
  end if;
  return query
  select a.id,a.user_id,p.full_name,u.email,a.activated_at,a.revoked_at,
         case when a.revoked_at is null then 'active' else 'revoked' end::text,
         a.annual_edition_id
    from public.institutional_activations a
    join auth.users u on u.id=a.user_id
    left join public.profiles p on p.id=a.user_id
   where a.institution_id=p_institution_id
     and (p_annual_edition_id is null or a.annual_edition_id=p_annual_edition_id)
   order by a.activated_at desc;
end;
$$;

revoke all on function public.list_institutional_activation_users(uuid,uuid) from public, anon;
grant execute on function public.list_institutional_activation_users(uuid,uuid) to authenticated;

-- Harden institutional SECURITY DEFINER RPC exposure.
revoke all on function public.admin_issue_institutional_code(uuid,uuid,text,timestamptz) from public, anon;
grant execute on function public.admin_issue_institutional_code(uuid,uuid,text,timestamptz) to authenticated;
revoke all on function public.admin_revoke_institutional_activation(uuid) from public, anon;
grant execute on function public.admin_revoke_institutional_activation(uuid) to authenticated;
revoke all on function public.redeem_institutional_code(text) from public, anon;
grant execute on function public.redeem_institutional_code(text) to authenticated;

grant select,insert,update,delete on public.institutional_managers to authenticated;
