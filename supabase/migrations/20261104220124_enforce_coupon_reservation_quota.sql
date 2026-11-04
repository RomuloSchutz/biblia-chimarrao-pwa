-- Service-only writes already enforce coupon validity and price in checkout.
-- Serialize reservations per coupon; FK key-share locks remain compatible.
-- Do not expire pending reservations by elapsed time alone: a remote payment
-- may still complete. Release only after a definitive rejection/cancellation.
create or replace function public.enforce_coupon_reservation_quota()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  coupon public.commercial_coupons%rowtype;
  total_reserved bigint;
  user_reserved bigint;
begin
  if new.status not in ('pending', 'redeemed') then
    return new;
  end if;

  select c.* into coupon
  from public.commercial_coupons c
  where c.id = new.coupon_id
  for no key update;
  if not found then
    raise exception 'coupon_invalid' using errcode = 'P0001';
  end if;

  select count(*), count(*) filter (where r.user_id = new.user_id)
  into total_reserved, user_reserved
  from public.commercial_coupon_redemptions r
  where r.coupon_id = new.coupon_id and r.status in ('pending', 'redeemed');

  if coupon.max_redemptions is not null and total_reserved >= coupon.max_redemptions then
    raise exception 'coupon_usage_limit_reached' using errcode = 'P0001';
  end if;
  if coupon.max_redemptions_per_user is not null and user_reserved >= coupon.max_redemptions_per_user then
    raise exception 'coupon_user_limit_reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_coupon_reservation_quota() from public, anon, authenticated;
drop trigger if exists enforce_coupon_reservation_quota on public.commercial_coupon_redemptions;
create trigger enforce_coupon_reservation_quota
before insert on public.commercial_coupon_redemptions
for each row execute function public.enforce_coupon_reservation_quota();

create index if not exists commercial_coupon_redemptions_reserved_idx
on public.commercial_coupon_redemptions (coupon_id, user_id)
where status in ('pending', 'redeemed');
