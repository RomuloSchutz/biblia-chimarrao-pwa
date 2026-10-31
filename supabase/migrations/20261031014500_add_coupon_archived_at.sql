alter table public.commercial_coupons
  add column if not exists archived_at timestamptz;

comment on column public.commercial_coupons.archived_at is
  'Soft-delete administrativo: remove a campanha do painel sem apagar histórico financeiro/redemptions.';
