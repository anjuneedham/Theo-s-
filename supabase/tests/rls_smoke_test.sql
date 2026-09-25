-- RLS smoke test: run after the migration + seed against a scratch database.
-- Fails (ERROR) if an anonymous or unrelated user can read private data.
begin;
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'alice@example.com'),
  ('22222222-2222-4222-8222-222222222222', 'bob@example.com');
insert into public.orders (id, order_number, tracking_token, restaurant_id, customer_id, contact_name, contact_phone,
  fulfillment_type, subtotal_cents, total_cents, payment_method)
select '33333333-3333-4333-8333-333333333333', 'TH-TEST01', 'tok', id, '11111111-1111-4111-8111-111111111111',
  'Alice', '8765550100', 'pickup', 1000, 1000, 'cash' from public.restaurants where slug = 'theos';

-- Anonymous visitor
set local role anon;
do $$ begin
  if (select count(*) from public.restaurants) = 0 then raise exception 'anon should see active restaurants'; end if;
  if (select count(*) from public.menu_items) = 0 then raise exception 'anon should see menus'; end if;
  if (select count(*) from public.orders) <> 0 then raise exception 'anon must not see orders'; end if;
  if (select count(*) from public.profiles) <> 0 then raise exception 'anon must not see profiles'; end if;
  if (select count(*) from public.promotions) <> 0 then raise exception 'anon must not see promo codes'; end if;
end $$;
reset role;

-- Bob (unrelated customer)
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
do $$ begin
  if (select count(*) from public.orders) <> 0 then raise exception 'bob must not see alice''s order'; end if;
  if (select count(*) from public.profiles where id <> auth.uid()) <> 0 then raise exception 'bob must not see other profiles'; end if;
end $$;

-- Alice (order owner)
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
do $$ begin
  if (select count(*) from public.orders) <> 1 then raise exception 'alice should see her order'; end if;
end $$;
-- Alice cannot promote herself
do $$ begin
  begin
    update public.profiles set role = 'admin' where id = auth.uid();
    raise exception 'role escalation was allowed';
  exception when others then
    if sqlerrm = 'role escalation was allowed' then raise; end if;
  end;
end $$;
reset role;
select 'RLS smoke test passed' as result;
rollback;
