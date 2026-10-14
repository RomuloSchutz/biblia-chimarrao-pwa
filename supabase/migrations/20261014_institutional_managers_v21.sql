-- Institutional licensing v2.1: manager assignment/context and single-institution hardening.
-- Additive migration. Preserves existing institutions, lots, codes and activations.

create unique index if not exists institutional_managers_one_institution_per_user_idx
  on public.institutional_managers(user_id);

create index if not exists institutional_managers_institution_status_idx
  on public.institutional_managers(institution_id,status);

create or replace function public.get_my_institutional_manager_context()
returns table(manager_id uuid,institution_id uuid,institution_name text,institution_status text,manager_status text)
language plpgsql
stable
security definer
set search_path=public
as $$
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  return query
  select m.id,a.id,a.name,a.status,m.status
    from public.institutional_managers m
    join public.institutional_accounts a on a.id=m.institution_id
   where m.user_id=auth.uid()
   limit 1;
end;
$$;
revoke all on function public.get_my_institutional_manager_context() from public, anon;
grant execute on function public.get_my_institutional_manager_context() to authenticated;

create or replace function public.admin_assign_institutional_manager(p_institution_id uuid,p_email text)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare v_user_id uuid; v_manager_id uuid;
begin
  if not public.is_app_admin() then raise exception 'admin_required'; end if;
  if not exists(select 1 from public.institutional_accounts where id=p_institution_id) then raise exception 'institution_not_found'; end if;
  select id into v_user_id from auth.users where lower(email)=lower(trim(p_email)) limit 1;
  if v_user_id is null then raise exception 'user_not_found'; end if;
  if exists(select 1 from public.institutional_managers where user_id=v_user_id and institution_id<>p_institution_id) then
    raise exception 'manager_already_linked_to_another_institution';
  end if;
  insert into public.institutional_managers(institution_id,user_id,status,created_by)
  values(p_institution_id,v_user_id,'active',auth.uid())
  on conflict(institution_id,user_id) do update set status='active'
  returning id into v_manager_id;
  return v_manager_id;
end;
$$;
revoke all on function public.admin_assign_institutional_manager(uuid,text) from public, anon;
grant execute on function public.admin_assign_institutional_manager(uuid,text) to authenticated;

create or replace function public.admin_set_institutional_manager_status(p_manager_id uuid,p_status text)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.is_app_admin() then raise exception 'admin_required'; end if;
  if p_status not in ('active','blocked') then raise exception 'invalid_status'; end if;
  update public.institutional_managers set status=p_status where id=p_manager_id;
  if not found then raise exception 'manager_not_found'; end if;
  return true;
end;
$$;
revoke all on function public.admin_set_institutional_manager_status(uuid,text) from public, anon;
grant execute on function public.admin_set_institutional_manager_status(uuid,text) to authenticated;

create or replace function public.admin_list_institutional_managers(p_institution_id uuid)
returns table(manager_id uuid,user_id uuid,full_name text,email text,status text,created_at timestamptz)
language plpgsql
stable
security definer
set search_path=public
as $$
begin
  if not public.is_app_admin() then raise exception 'admin_required'; end if;
  return query
  select m.id,m.user_id,p.full_name,u.email,m.status,m.created_at
    from public.institutional_managers m
    join auth.users u on u.id=m.user_id
    left join public.profiles p on p.id=m.user_id
   where m.institution_id=p_institution_id
   order by m.created_at desc;
end;
$$;
revoke all on function public.admin_list_institutional_managers(uuid) from public, anon;
grant execute on function public.admin_list_institutional_managers(uuid) to authenticated;

create or replace function public.get_institutional_manager_summary(p_institution_id uuid)
returns table(annual_edition_id uuid,year integer,title text,purchased bigint,activated bigint,available bigint)
language plpgsql
stable
security definer
set search_path=public
as $$
begin
  if not (public.is_app_admin() or public.is_institution_manager(p_institution_id)) then raise exception 'institution_manager_required'; end if;
  return query
  select s.annual_edition_id,s.year,s.edition_title,s.purchased,s.activated,s.available
    from public.institutional_license_summary s
   where s.institution_id=p_institution_id
   order by s.year desc;
end;
$$;
revoke all on function public.get_institutional_manager_summary(uuid) from public, anon;
grant execute on function public.get_institutional_manager_summary(uuid) to authenticated;

create or replace function public.search_institutional_activation_users(p_institution_id uuid,p_annual_edition_id uuid default null,p_search text default null)
returns table(activation_id uuid,user_id uuid,full_name text,email text,activated_at timestamptz,revoked_at timestamptz,status text,annual_edition_id uuid)
language plpgsql
stable
security definer
set search_path=public
as $$
declare v_search text:=nullif(trim(p_search),'');
begin
  if not (public.is_app_admin() or public.is_institution_manager(p_institution_id)) then raise exception 'institution_manager_required'; end if;
  return query
  select a.id,a.user_id,p.full_name,u.email,a.activated_at,a.revoked_at,
         case when a.revoked_at is null then 'active' else 'revoked' end::text,a.annual_edition_id
    from public.institutional_activations a
    join auth.users u on u.id=a.user_id
    left join public.profiles p on p.id=a.user_id
   where a.institution_id=p_institution_id
     and (p_annual_edition_id is null or a.annual_edition_id=p_annual_edition_id)
     and (v_search is null or coalesce(p.full_name,'') ilike '%'||v_search||'%' or coalesce(u.email,'') ilike '%'||v_search||'%')
   order by a.activated_at desc;
end;
$$;
revoke all on function public.search_institutional_activation_users(uuid,uuid,text) from public, anon;
grant execute on function public.search_institutional_activation_users(uuid,uuid,text) to authenticated;

-- Edition must be active when a manager/admin creates a new institutional activation code.
create or replace function public.issue_institutional_code(p_institution_id uuid,p_annual_edition_id uuid,p_label text default null,p_expires_at timestamptz default null)
returns text
language plpgsql
security definer
set search_path=public
as $$
declare v_code text;
begin
  if not (public.is_app_admin() or public.is_institution_manager(p_institution_id)) then raise exception 'institution_manager_required'; end if;
  if not exists(select 1 from public.institutional_accounts where id=p_institution_id and status='active') then raise exception 'institution_not_found_or_blocked'; end if;
  if not exists(select 1 from public.app_annual_editions where id=p_annual_edition_id and is_active=true) then raise exception 'annual_edition_not_active'; end if;
  if not exists(select 1 from public.institutional_license_lots where institution_id=p_institution_id and annual_edition_id=p_annual_edition_id) then raise exception 'institution_has_no_license_lot'; end if;
  loop
    v_code:='BC-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,4))||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,4));
    exit when not exists(select 1 from public.institutional_activation_codes where code=v_code);
  end loop;
  insert into public.institutional_activation_codes(institution_id,annual_edition_id,label,code,expires_at,created_by)
  values(p_institution_id,p_annual_edition_id,nullif(trim(p_label),''),v_code,p_expires_at,auth.uid());
  return v_code;
end;
$$;
revoke all on function public.issue_institutional_code(uuid,uuid,text,timestamptz) from public, anon;
grant execute on function public.issue_institutional_code(uuid,uuid,text,timestamptz) to authenticated;
