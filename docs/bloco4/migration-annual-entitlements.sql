-- BLOCO 4 — RASCUNHO / DRY-RUN
-- NÃO EXECUTAR AUTOMATICAMENTE EM PRODUÇÃO.
-- Objetivo: separar acesso anual do aplicativo de direitos de biblioteca/EPUB.
-- Preparado para revisão e aprovação explícita antes de qualquer aplicação no Supabase.

begin;

-- 1) Catálogo lógico das edições anuais do aplicativo.
create table if not exists public.app_annual_editions (
  id uuid primary key default gen_random_uuid(),
  year integer not null unique check (year between 2027 and 2100),
  title text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) Direito anual separado de user_editions (que continua reservado à biblioteca/EPUB).
create table if not exists public.user_annual_editions (
  user_id uuid not null references auth.users(id) on delete cascade,
  annual_edition_id uuid not null references public.app_annual_editions(id) on delete cascade,
  source text not null check (source in ('purchase','admin','corporate','promotion','legacy')),
  order_reference uuid null references public.orders(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz null,
  primary key (user_id, annual_edition_id)
);

create index if not exists user_annual_editions_user_active_idx
  on public.user_annual_editions(user_id, annual_edition_id)
  where revoked_at is null;

-- 3) Edição anual inicial. Não reutiliza a edição EPUB/devocional existente.
insert into public.app_annual_editions(year,title,is_active)
values (2027,'Bíblia + Chimarrão — Edição 2027',true)
on conflict (year) do update set title=excluded.title;

-- 4) Backfill controlado do comprador anual já pago.
-- O vínculo é pelo product_code da compra real, nunca pelo EPUB 2027.
insert into public.user_annual_editions(user_id,annual_edition_id,source,order_reference)
select distinct o.user_id, ae.id, 'purchase', o.id
from public.orders o
join public.app_annual_editions ae on ae.year=2027
where o.product_code='app_biblia_chimarrao'
  and o.status='paid'
  and not exists (
    select 1 from public.user_annual_editions uae
    where uae.user_id=o.user_id and uae.annual_edition_id=ae.id
  );

-- 5) ASSERTS: abortam a transação se o backfill não preservar todos os compradores pagos.
do $$
declare
  paid_buyers integer;
  entitled_buyers integer;
begin
  select count(distinct user_id) into paid_buyers
  from public.orders
  where product_code='app_biblia_chimarrao' and status='paid';

  select count(distinct uae.user_id) into entitled_buyers
  from public.user_annual_editions uae
  join public.app_annual_editions ae on ae.id=uae.annual_edition_id
  where ae.year=2027 and uae.revoked_at is null
    and exists (
      select 1 from public.orders o
      where o.user_id=uae.user_id
        and o.product_code='app_biblia_chimarrao'
        and o.status='paid'
    );

  if entitled_buyers <> paid_buyers then
    raise exception 'Backfill anual 2027 inconsistente: pagos %, direitos %', paid_buyers, entitled_buyers;
  end if;
end $$;

-- IMPORTANTE:
-- app_access permanece intacto nesta primeira migração como compatibilidade legada.
-- user_editions permanece intacto e continua sendo biblioteca/EPUB.
-- A troca do webhook e da UI só ocorre depois da validação deste modelo.

rollback;
-- Este arquivo é deliberadamente um dry-run. A versão de produção será separada e só
-- será aplicada após aprovação explícita do proprietário do projeto.
