-- Theo's Restaurant & Lounge + platform configuration. SAMPLE content: replace menu, prices,
-- hours and contact details with real information (all editable in the dashboards).

insert into public.platform_settings (id, platform_name, currency, default_commission_bps, service_fee_bps, service_fee_min_cents, service_fee_max_cents, service_fee_on_anchor, tax_rate_bps, tax_inclusive, driver_base_payout_cents, driver_fee_share_bps, payment_methods, allow_guest_checkout, support_email, support_phone, updated_at) values
  ('default', 'Theo''s Delivery Network', 'JMD', 1500, 500, 10000, 60000, false, 1500, true, 25000, 6000, array['cash', 'card_on_delivery', 'online']::text[], true, 'hello@theos.example', '+1 (876) 555-0142', '2026-01-01T00:00:00.000Z')
on conflict (id) do nothing;

insert into public.regions (id, slug, name, country, currency, timezone, is_active, sort_order) values
  ('accd19e1-7a54-5f39-b598-fde736087fc5', 'kingston-st-andrew', 'Kingston & St. Andrew', 'JM', 'JMD', 'America/Jamaica', true, 1),
  ('ffa794e5-db3b-5480-9404-b52b810463ef', 'st-catherine', 'St. Catherine (Spanish Town & Portmore)', 'JM', 'JMD', 'America/Jamaica', true, 2),
  ('3c66d843-1c4d-5e74-a04e-06198acfac97', 'st-james', 'St. James (Montego Bay)', 'JM', 'JMD', 'America/Jamaica', true, 3),
  ('2dcc07a5-22ef-5ce7-9ab9-13b724e571d2', 'st-ann', 'St. Ann (Ocho Rios)', 'JM', 'JMD', 'America/Jamaica', true, 4)
on conflict (id) do nothing;

insert into public.restaurant_categories (id, slug, name, sort_order) values
  ('4630e714-9c75-586c-8c13-7a0da919d584', 'jamaican', 'Jamaican', 0),
  ('228aa5a1-4591-5240-90a0-e7876f250dc0', 'seafood', 'Seafood', 1),
  ('1efeb436-e4d1-53db-8603-7282517541c9', 'vegan-and-ital', 'Vegan & Ital', 2),
  ('f159b0e0-ddcc-544a-a30a-14192589b6c0', 'patties-and-bakery', 'Patties & Bakery', 3),
  ('af9655c9-9d10-5013-bf13-02e39e18452a', 'lounge-and-bar', 'Lounge & Bar', 4),
  ('10de909c-4a55-5131-bcea-518814bcce50', 'chinese', 'Chinese', 5),
  ('0273e452-bfd4-5eea-9e43-1a5fc937ce23', 'pizza', 'Pizza', 6),
  ('fd6f1d22-6d3e-564f-8a60-21f540434d3f', 'desserts', 'Desserts', 7),
  ('555be721-8b87-5575-be20-cb26366a9467', 'breakfast', 'Breakfast', 8)
on conflict (id) do nothing;

insert into public.subscription_plans (id, slug, name, description, monthly_fee_cents, commission_rate_bps, features, is_active, sort_order) values
  ('fc09c6be-8ae0-549c-8b54-f5abb3529a83', 'starter', 'Starter', 'No monthly fee. Pay commission only on orders you receive.', 0, 1800, array['Marketplace listing', 'Online menu & ordering', 'Order dashboard', 'Weekly payouts']::text[], true, 1),
  ('e288df22-246f-584f-9652-de59388d6afb', 'growth', 'Growth', 'Lower commission for restaurants with steady volume.', 1500000, 1400, array['Everything in Starter', 'Promotions & discount codes', 'Sales analytics', 'Priority support']::text[], true, 2),
  ('4a4582e1-ae33-57bf-884d-dfec5a567cb8', 'pro', 'Pro', 'Lowest commission plus a monthly featured placement.', 3500000, 1000, array['Everything in Growth', 'Monthly featured placement', 'Dedicated account manager']::text[], true, 3)
on conflict (id) do nothing;

insert into public.restaurants (id, tagline, description, region_id, phone, email, whatsapp, address_line, area, city, parish, country, latitude, longitude, timezone, currency, logo_url, cover_url, status, is_anchor, is_featured, plan_id, commission_rate_bps, accepts_delivery, accepts_pickup, min_order_cents, prep_time_minutes, rating_avg, rating_count, social_instagram, social_facebook, social_tiktok, created_at, slug, name) values
  ('8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'Island soul food, late-night lounge.', 'Theo''s is a Jamaican restaurant and lounge serving slow-marinated jerk, rich Sunday stews and fresh seafood by day — and handcrafted rum cocktails, music and good company by night.', 'accd19e1-7a54-5f39-b598-fde736087fc5', '+1 (876) 555-0142', 'hello@theos.example', '+18765550142', null, null, 'Kingston', 'St. Andrew', 'JM', 18.0179, -76.8099, 'America/Jamaica', 'JMD', null, null, 'active', true, true, null, 0, true, true, 0, 25, 0, 0, 'https://instagram.com/', 'https://facebook.com/', null, '2026-01-01T00:00:00.000Z', 'theos', 'Theo''s Restaurant & Lounge')
on conflict (id) do nothing;

insert into public.restaurant_category_assignments (id, restaurant_id, category_id) values
  ('2278311b-0cb4-5767-b036-681974554572', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '4630e714-9c75-586c-8c13-7a0da919d584'),
  ('1842bc96-3cee-500c-94a2-820ceff6f84a', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'af9655c9-9d10-5013-bf13-02e39e18452a'),
  ('7f3a0860-132c-53f7-a785-0318865b0ad5', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '228aa5a1-4591-5240-90a0-e7876f250dc0'),
  ('6bf7cd83-76e4-502c-872b-35db578e2c1a', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '555be721-8b87-5575-be20-cb26366a9467')
on conflict (id) do nothing;

insert into public.operating_hours (id, restaurant_id, day_of_week, opens_at, closes_at, is_closed) values
  ('25a4e82f-8050-5a3f-b976-19a293ef3da2', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 0, '10:00', '21:00', false),
  ('1b27e942-03b9-5b1f-b0dd-8f61842ebc52', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 1, '11:00', '22:00', false),
  ('85c78c13-74f0-5265-8614-3854e4368b14', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 2, '11:00', '22:00', false),
  ('78a0c0ce-1e6d-53e7-89d7-fa592b3610f4', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 3, '11:00', '22:00', false),
  ('db3c2621-0119-5270-800c-d46937d0757b', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 4, '11:00', '23:00', false),
  ('e2bb2e88-9e68-5a48-9aa3-93be7c1ad72f', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 5, '11:00', '02:00', false),
  ('e475fe0f-9501-5b66-a3e2-7425e697094d', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 6, '10:00', '02:00', false)
on conflict (id) do nothing;

insert into public.menu_categories (id, restaurant_id, name, slug, description, sort_order, is_active, available_from, available_until) values
  ('8b536358-63a7-5b76-93fc-92a5ba520ff7', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'Breakfast', 'breakfast', 'Served 7:00am – 11:30am.', 0, true, '07:00', '11:30'),
  ('7fc71f23-c01a-5a18-9410-202a36afb72f', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'Appetizers', 'appetizers', null, 1, true, null, null),
  ('e7b4af6d-f336-5d99-8e27-0f35e57d3a0f', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'Lunch', 'lunch', 'Lunch boxes served 11:00am – 4:00pm.', 2, true, '11:00', '16:00'),
  ('87a3684c-d333-5ec6-ac02-1268ba499c0a', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'Main Courses', 'main-courses', 'Dinner plates, all served with your choice of side.', 3, true, null, null),
  ('15bb519d-d9a6-570b-8843-3b1f8a60f704', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'Sides', 'sides', null, 4, true, null, null),
  ('fab80d4e-251d-58be-8ac6-dd8dc672217a', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'Drinks', 'drinks', null, 5, true, null, null),
  ('c4954ab3-5700-59fb-acb3-b754192b5dbb', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'Cocktails', 'cocktails', '18+ only. Valid ID required on pickup and delivery.', 6, true, null, null),
  ('7fe8da72-151e-5fe4-ac5b-95e0beea30d8', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'Desserts', 'desserts', null, 7, true, null, null),
  ('9639f319-91a3-5c36-8ebd-8aba60a8501d', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'Specials', 'specials', 'Weekly specials from the kitchen.', 8, true, null, null)
on conflict (id) do nothing;

insert into public.menu_items (id, restaurant_id, category_id, name, description, price_cents, image_url, is_available, is_featured, dietary_tags, spice_level, sort_order, created_at) values
  ('f20b84ca-2a65-52ee-85b2-179ff36b5414', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '8b536358-63a7-5b76-93fc-92a5ba520ff7', 'Ackee & Saltfish', 'Jamaica''s national dish, sautéed with onion, tomato and sweet pepper. Served with fried dumplings and boiled banana.', 165000, null, true, true, '{}'::text[], 0, 0, '2026-01-01T00:00:00.000Z'),
  ('670aaacd-1ebc-57eb-98fe-cac190a28629', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '8b536358-63a7-5b76-93fc-92a5ba520ff7', 'Callaloo & Saltfish', 'Steamed callaloo with flaked saltfish, served with fried dumplings.', 145000, null, true, false, '{}'::text[], 0, 1, '2026-01-01T00:00:00.000Z'),
  ('1a33a955-0311-5089-b502-cd2d0f5db51e', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '8b536358-63a7-5b76-93fc-92a5ba520ff7', 'Mackerel Rundown', 'Mackerel simmered down in spiced coconut milk with green banana and dumplings.', 150000, null, true, false, '{}'::text[], 0, 2, '2026-01-01T00:00:00.000Z'),
  ('3d49bfb3-e683-576c-87de-bf8ad2cace8d', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '8b536358-63a7-5b76-93fc-92a5ba520ff7', 'Theo''s Big Breakfast', 'Ackee & saltfish, callaloo, fried plantain, dumplings and a mug of Blue Mountain coffee.', 235000, null, true, false, '{}'::text[], 0, 3, '2026-01-01T00:00:00.000Z'),
  ('d966df18-194b-58ed-9ea9-2416f332981b', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '7fc71f23-c01a-5a18-9410-202a36afb72f', 'Jerk Wings', 'Eight wings, 24-hour jerk marinade, pimento-smoked and glazed. Served with ranch.', 160000, null, true, true, '{}'::text[], 2, 0, '2026-01-01T00:00:00.000Z'),
  ('29917357-32e2-54a1-8005-1ad29d7de5e6', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '7fc71f23-c01a-5a18-9410-202a36afb72f', 'Pepper Shrimp', 'Middle Quarters-style shrimp steamed in scotch bonnet, garlic and pimento.', 190000, null, true, false, '{}'::text[], 3, 1, '2026-01-01T00:00:00.000Z'),
  ('e8075d1c-38be-588c-917d-c0af6d4cd4b2', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '7fc71f23-c01a-5a18-9410-202a36afb72f', 'Saltfish Fritters', 'Crispy stamp-and-go fritters with a sweet chilli dip.', 110000, null, true, false, '{}'::text[], 0, 2, '2026-01-01T00:00:00.000Z'),
  ('759bdf16-d20c-5548-b6c7-2bcb9c307a83', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '7fc71f23-c01a-5a18-9410-202a36afb72f', 'Festival Basket', 'Six golden, lightly sweet festivals. Perfect for sharing.', 70000, null, true, false, array['vegetarian']::text[], 0, 3, '2026-01-01T00:00:00.000Z'),
  ('7e75ec53-de6d-5bf7-b089-b87a54df9bc9', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '7fc71f23-c01a-5a18-9410-202a36afb72f', 'Mini Beef Patty Sliders', 'Three bite-size beef patties tucked in coco bread.', 125000, null, true, false, '{}'::text[], 0, 4, '2026-01-01T00:00:00.000Z'),
  ('209833c6-d24c-527b-b8d2-c1b6fe86ce89', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'e7b4af6d-f336-5d99-8e27-0f35e57d3a0f', 'Jerk Chicken Lunch Box', 'Quarter jerk chicken with rice & peas and coleslaw.', 135000, null, true, false, '{}'::text[], 2, 0, '2026-01-01T00:00:00.000Z'),
  ('53e94f83-ffea-5799-ba01-f22f2122bb08', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'e7b4af6d-f336-5d99-8e27-0f35e57d3a0f', 'Curry Chicken Lunch Box', 'Tender curry chicken and potato with white rice and steamed vegetables.', 130000, null, true, false, '{}'::text[], 1, 1, '2026-01-01T00:00:00.000Z'),
  ('ef92867f-ffb9-5c66-b8a8-49fb3bbbf7a8', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'e7b4af6d-f336-5d99-8e27-0f35e57d3a0f', 'Stew Peas Lunch Box', 'Red peas stewed with salted pig tail, beef and spinners.', 140000, null, true, false, '{}'::text[], 0, 2, '2026-01-01T00:00:00.000Z'),
  ('3bd2f2ef-44eb-55c3-a3a9-c5cf4309d8b6', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '87a3684c-d333-5ec6-ac02-1268ba499c0a', 'Jerk Chicken', 'Marinated overnight, slow-grilled over pimento wood. Served with rice & peas, festival and steamed vegetables.', 195000, null, true, true, '{}'::text[], 2, 0, '2026-01-01T00:00:00.000Z'),
  ('75940b55-1dc9-5094-9358-1e09e0b28b83', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '87a3684c-d333-5ec6-ac02-1268ba499c0a', 'Braised Oxtail', 'Fall-off-the-bone oxtail with butter beans in a rich, glossy gravy.', 320000, null, true, true, '{}'::text[], 0, 1, '2026-01-01T00:00:00.000Z'),
  ('1f0ed1af-1384-5c37-9c7e-e3220ab95a0e', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '87a3684c-d333-5ec6-ac02-1268ba499c0a', 'Curry Goat', 'Bone-in goat slow-cooked with Jamaican curry, thyme and scotch bonnet.', 270000, null, true, false, '{}'::text[], 2, 2, '2026-01-01T00:00:00.000Z'),
  ('6fa9214a-9df5-52d0-99c9-15e866634587', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '87a3684c-d333-5ec6-ac02-1268ba499c0a', 'Escovitch Snapper', 'Whole fried red snapper topped with pickled scotch bonnet, carrot and onion.', 360000, null, true, true, '{}'::text[], 2, 3, '2026-01-01T00:00:00.000Z'),
  ('0a788baf-9923-5b76-85be-3fed79c2b2be', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '87a3684c-d333-5ec6-ac02-1268ba499c0a', 'Brown Stew Chicken', 'Chicken browned and stewed with carrots, peppers and fresh thyme.', 185000, null, true, false, '{}'::text[], 0, 4, '2026-01-01T00:00:00.000Z'),
  ('60a5d2f3-c9b4-53b8-8cc3-a3c900f425f3', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '87a3684c-d333-5ec6-ac02-1268ba499c0a', 'Jerk Pork', 'Boston-style jerk pork, chopped and served with hard dough bread.', 220000, null, true, false, '{}'::text[], 2, 5, '2026-01-01T00:00:00.000Z'),
  ('4ca2c930-74f1-5be0-a248-88849d404b81', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '87a3684c-d333-5ec6-ac02-1268ba499c0a', 'Rasta Pasta', 'Penne in a creamy jerk-spiced sauce with sweet peppers.', 210000, null, true, false, array['vegetarian']::text[], 1, 6, '2026-01-01T00:00:00.000Z'),
  ('a4936966-a3d6-57f4-872c-5dd80a034a76', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '87a3684c-d333-5ec6-ac02-1268ba499c0a', 'Grilled Lobster Tail', 'Seasonal. Garlic-butter grilled lobster tail. Available during lobster season only.', 520000, null, false, false, '{}'::text[], 0, 7, '2026-01-01T00:00:00.000Z'),
  ('1f253cca-b34a-5ed6-a5f0-48d13b2a8114', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '15bb519d-d9a6-570b-8843-3b1f8a60f704', 'Rice & Peas', 'Coconut rice with kidney beans, thyme and pimento.', 45000, null, true, false, array['vegan']::text[], 0, 0, '2026-01-01T00:00:00.000Z'),
  ('9e746c1b-2c31-54c9-a7b5-d2efb28419ad', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '15bb519d-d9a6-570b-8843-3b1f8a60f704', 'Festival (3)', 'Sweet fried cornmeal dumplings.', 40000, null, true, false, array['vegetarian']::text[], 0, 1, '2026-01-01T00:00:00.000Z'),
  ('896a04dc-6542-5f19-b53b-3dc45ce51fec', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '15bb519d-d9a6-570b-8843-3b1f8a60f704', 'Fried Ripe Plantain', 'Caramelised sweet plantain.', 45000, null, true, false, array['vegan']::text[], 0, 2, '2026-01-01T00:00:00.000Z'),
  ('11d716c1-a977-5304-88b5-537b495e9e40', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '15bb519d-d9a6-570b-8843-3b1f8a60f704', 'Bammy', 'Fried cassava flatbread.', 40000, null, true, false, array['vegan']::text[], 0, 3, '2026-01-01T00:00:00.000Z'),
  ('f35545bf-aaef-5609-ab60-fc7ace04f1f0', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '15bb519d-d9a6-570b-8843-3b1f8a60f704', 'Steamed Vegetables', 'Cabbage, carrot and callaloo.', 45000, null, true, false, array['vegan']::text[], 0, 4, '2026-01-01T00:00:00.000Z'),
  ('985efca9-440a-503e-924f-a7aeb749f491', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '15bb519d-d9a6-570b-8843-3b1f8a60f704', 'Roast Breadfruit', 'Fire-roasted, sliced and fried.', 50000, null, true, false, array['vegan']::text[], 0, 5, '2026-01-01T00:00:00.000Z'),
  ('4d242a98-f5d9-5cd3-b538-8138d33906e1', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '15bb519d-d9a6-570b-8843-3b1f8a60f704', 'Mac & Cheese Pie', 'Baked, Jamaican style.', 65000, null, true, false, array['vegetarian']::text[], 0, 6, '2026-01-01T00:00:00.000Z'),
  ('05c8592b-7bee-58ba-b780-dc14508e1cd4', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'fab80d4e-251d-58be-8ac6-dd8dc672217a', 'Sorrel', 'Hibiscus steeped with ginger and pimento.', 55000, null, true, false, array['vegan']::text[], 0, 0, '2026-01-01T00:00:00.000Z'),
  ('f6a0b9b9-835a-5eab-9f0f-d88872cfa79d', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'fab80d4e-251d-58be-8ac6-dd8dc672217a', 'Carrot Juice', 'Fresh carrot juice with nutmeg and a hint of lime.', 60000, null, true, false, '{}'::text[], 0, 1, '2026-01-01T00:00:00.000Z'),
  ('70cca70d-26cc-5756-8ca1-0dc7692dba86', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'fab80d4e-251d-58be-8ac6-dd8dc672217a', 'Ginger Beer', 'House-brewed, fiery and fresh.', 50000, null, true, false, array['vegan']::text[], 0, 2, '2026-01-01T00:00:00.000Z'),
  ('23bfae7b-aa5d-5871-a705-a7ba0ebabcdc', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'fab80d4e-251d-58be-8ac6-dd8dc672217a', 'Fresh Coconut Water', 'Straight from the jelly.', 50000, null, true, false, array['vegan']::text[], 0, 3, '2026-01-01T00:00:00.000Z'),
  ('88a624b7-ea00-5338-bdf0-7546afc4176b', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'fab80d4e-251d-58be-8ac6-dd8dc672217a', 'Blue Mountain Coffee', 'Hot brewed Jamaica Blue Mountain coffee.', 65000, null, true, false, '{}'::text[], 0, 4, '2026-01-01T00:00:00.000Z'),
  ('01c77921-1fef-5554-b1c1-54d965d2198e', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'fab80d4e-251d-58be-8ac6-dd8dc672217a', 'Soft Drink', 'Ting, Kola Champagne or cola.', 30000, null, true, false, '{}'::text[], 0, 5, '2026-01-01T00:00:00.000Z'),
  ('52a70df0-ed17-5614-92c9-c79cb2f9d925', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'c4954ab3-5700-59fb-acb3-b754192b5dbb', 'Theo''s Rum Punch', 'Overproof white rum, strawberry syrup, lime and pineapple.', 140000, null, true, true, array['alcohol']::text[], 0, 0, '2026-01-01T00:00:00.000Z'),
  ('5180b193-f6c7-56bc-90fe-adc016e941bf', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'c4954ab3-5700-59fb-acb3-b754192b5dbb', 'Sorrel Sangria', 'Sorrel, red wine, rum and citrus.', 150000, null, true, false, array['alcohol']::text[], 0, 1, '2026-01-01T00:00:00.000Z'),
  ('6050bd2e-1181-5706-95d1-720083724ef5', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'c4954ab3-5700-59fb-acb3-b754192b5dbb', 'Blue Mountain Espresso Martini', 'Vodka, coffee liqueur and Blue Mountain espresso.', 170000, null, true, false, array['alcohol']::text[], 0, 2, '2026-01-01T00:00:00.000Z'),
  ('57f77f6b-67b8-5989-852e-450afa15bf04', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'c4954ab3-5700-59fb-acb3-b754192b5dbb', 'Mango Mojito', 'White rum, fresh mango, mint and lime.', 150000, null, true, false, array['alcohol']::text[], 0, 3, '2026-01-01T00:00:00.000Z'),
  ('65f9f619-d76d-5511-b500-d4af426c5c60', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'c4954ab3-5700-59fb-acb3-b754192b5dbb', 'Guinness Punch', 'Guinness, condensed milk, nutmeg and vanilla.', 110000, null, true, false, array['alcohol']::text[], 0, 4, '2026-01-01T00:00:00.000Z'),
  ('0a55e4cc-e6ee-5c46-bf96-12cb48b822d8', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '7fe8da72-151e-5fe4-ac5b-95e0beea30d8', 'Rum Cake', 'Dark fruit cake soaked in Jamaican rum.', 90000, null, true, true, array['alcohol']::text[], 0, 0, '2026-01-01T00:00:00.000Z'),
  ('ce6c6fba-b3db-5c29-a95b-fba90d606927', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '7fe8da72-151e-5fe4-ac5b-95e0beea30d8', 'Sweet Potato Pudding', '''Hell a top, hell a bottom, hallelujah in the middle.''', 85000, null, true, false, array['vegetarian']::text[], 0, 1, '2026-01-01T00:00:00.000Z'),
  ('92e04aa4-a8f7-5cca-8d53-85adde081fc7', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '7fe8da72-151e-5fe4-ac5b-95e0beea30d8', 'Coconut Drops', 'Diced coconut in ginger and brown-sugar candy.', 50000, null, true, false, array['vegan']::text[], 0, 2, '2026-01-01T00:00:00.000Z'),
  ('102d1817-1b1d-57e7-905e-4182fce50197', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '7fe8da72-151e-5fe4-ac5b-95e0beea30d8', 'Grater Cake Sundae', 'Vanilla ice cream, pink grater cake crumble and toasted coconut.', 95000, null, true, false, array['vegetarian']::text[], 0, 3, '2026-01-01T00:00:00.000Z'),
  ('1f742d92-5a1b-5a16-b5ef-7688653cd8cb', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '9639f319-91a3-5c36-8ebd-8aba60a8501d', 'Sunday Brunch Platter', 'Ackee & saltfish, jerk chicken, fried dumplings, plantain and a sorrel mimosa. Sundays only.', 380000, null, true, true, array['alcohol']::text[], 0, 0, '2026-01-01T00:00:00.000Z'),
  ('893c5a48-3b35-51e7-af63-954a369976cd', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '9639f319-91a3-5c36-8ebd-8aba60a8501d', 'Friday Seafood Boil', 'Shrimp, crab, corn and potato in garlic-pepper butter. Fridays from 5pm.', 420000, null, true, false, '{}'::text[], 2, 1, '2026-01-01T00:00:00.000Z')
on conflict (id) do nothing;

insert into public.menu_item_modifier_groups (id, restaurant_id, menu_item_id, name, min_select, max_select, sort_order) values
  ('f6d5ead5-5c9f-5957-93e1-2aa49c41d8c4', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'f20b84ca-2a65-52ee-85b2-179ff36b5414', 'Swap your side', 1, 1, 0),
  ('118f78bd-464e-512e-9d26-445ad2c077b2', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'd966df18-194b-58ed-9ea9-2416f332981b', 'Heat level', 1, 1, 0),
  ('eb7f43ba-77c8-54d7-bbdb-0091f95646c4', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '209833c6-d24c-527b-b8d2-c1b6fe86ce89', 'Heat level', 1, 1, 0),
  ('6e3b6508-843b-524e-95fc-21a4fe0ff9a0', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '209833c6-d24c-527b-b8d2-c1b6fe86ce89', 'Choose your side', 1, 1, 1),
  ('1b0ffec5-2f05-59f6-8ee7-dd9c134c1902', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '53e94f83-ffea-5799-ba01-f22f2122bb08', 'Choose your side', 1, 1, 0),
  ('f83e2986-9c15-51c1-a183-ce611999f1d0', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'ef92867f-ffb9-5c66-b8a8-49fb3bbbf7a8', 'Choose your side', 1, 1, 0),
  ('5eae3a79-9c60-59be-a17e-c7509f5b703c', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '3bd2f2ef-44eb-55c3-a3a9-c5cf4309d8b6', 'Portion', 1, 1, 0),
  ('fcee7588-42bb-541b-a817-06f9dca340ca', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '3bd2f2ef-44eb-55c3-a3a9-c5cf4309d8b6', 'Heat level', 1, 1, 1),
  ('340d528d-81be-5b36-b481-600e7a47c585', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '3bd2f2ef-44eb-55c3-a3a9-c5cf4309d8b6', 'Choose your side', 1, 1, 2),
  ('1f4ec026-0d62-5761-8c63-a68482679a70', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '3bd2f2ef-44eb-55c3-a3a9-c5cf4309d8b6', 'Add-ons', 0, 5, 3),
  ('4fcdf7cd-663c-5724-9d3b-87652e3b8026', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '75940b55-1dc9-5094-9358-1e09e0b28b83', 'Portion', 1, 1, 0),
  ('098b82a2-4d74-5efa-94f5-259aafc69466', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '75940b55-1dc9-5094-9358-1e09e0b28b83', 'Choose your side', 1, 1, 1),
  ('2411a53b-5a9c-5bf5-bd1e-773f91716e01', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '75940b55-1dc9-5094-9358-1e09e0b28b83', 'Add-ons', 0, 5, 2),
  ('87b3db7f-b2cf-5812-919d-0980c0478baf', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '1f0ed1af-1384-5c37-9c7e-e3220ab95a0e', 'Choose your side', 1, 1, 0),
  ('b027b5e4-de67-567b-b455-3feab4f629e6', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '1f0ed1af-1384-5c37-9c7e-e3220ab95a0e', 'Add-ons', 0, 5, 1),
  ('1088baa4-de73-5496-8150-b7aa6950b32b', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '6fa9214a-9df5-52d0-99c9-15e866634587', 'Choose your side', 1, 1, 0),
  ('7439af4f-c08f-56b9-baf6-51d6f478b7b8', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '6fa9214a-9df5-52d0-99c9-15e866634587', 'Add-ons', 0, 5, 1),
  ('a1629493-c796-5af1-8054-dbda1966ac4a', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '0a788baf-9923-5b76-85be-3fed79c2b2be', 'Choose your side', 1, 1, 0),
  ('cc1b1938-2e5f-5cd7-8364-9c68071408e9', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '0a788baf-9923-5b76-85be-3fed79c2b2be', 'Add-ons', 0, 5, 1),
  ('14bcbcf6-5df5-5dcd-b8d3-917316904c95', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '60a5d2f3-c9b4-53b8-8cc3-a3c900f425f3', 'Heat level', 1, 1, 0),
  ('234acd6d-4ae1-5c41-982f-ab7a988eb41e', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '60a5d2f3-c9b4-53b8-8cc3-a3c900f425f3', 'Choose your side', 1, 1, 1),
  ('e03cf893-0846-5a7b-ae04-b7365eb412b1', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '60a5d2f3-c9b4-53b8-8cc3-a3c900f425f3', 'Add-ons', 0, 5, 2),
  ('8e346e15-3541-52e4-b292-7d89fc9c3e38', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '4ca2c930-74f1-5be0-a248-88849d404b81', 'Add protein', 0, 1, 0),
  ('2bf80a79-cfb8-5ecc-9959-d0b0cc03f0f5', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'a4936966-a3d6-57f4-872c-5dd80a034a76', 'Choose your side', 1, 1, 0),
  ('7e98e512-74b2-5807-b200-17355cefc548', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '05c8592b-7bee-58ba-b780-dc14508e1cd4', 'Size', 1, 1, 0),
  ('8bbd9e03-e5bc-5633-b19f-707646241e39', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'f6a0b9b9-835a-5eab-9f0f-d88872cfa79d', 'Size', 1, 1, 0),
  ('17b6c853-3011-50f0-8eed-af683a6dd5ce', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '70cca70d-26cc-5756-8ca1-0dc7692dba86', 'Size', 1, 1, 0),
  ('0965d1f8-3041-566d-977d-2a7ff19e5bd6', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '01c77921-1fef-5554-b1c1-54d965d2198e', 'Flavour', 1, 1, 0),
  ('84924ff7-a38c-5d0d-bbef-1c9a06b01335', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '52a70df0-ed17-5614-92c9-c79cb2f9d925', 'Make it', 0, 1, 0)
on conflict (id) do nothing;

insert into public.menu_item_modifiers (id, restaurant_id, group_id, name, price_delta_cents, is_available, is_default, sort_order) values
  ('68590db0-bcc9-5a2d-9b09-afd88b29e0e1', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'f6d5ead5-5c9f-5957-93e1-2aa49c41d8c4', 'Fried Dumplings & Banana', 0, true, true, 0),
  ('cb765fb9-3c16-53f7-b7af-7ac89b7222d1', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'f6d5ead5-5c9f-5957-93e1-2aa49c41d8c4', 'Hard Dough Bread', 0, true, false, 1),
  ('15bdcd27-3d33-5646-b144-f3ce89c9e345', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'f6d5ead5-5c9f-5957-93e1-2aa49c41d8c4', 'Roast Breadfruit', 15000, true, false, 2),
  ('2555b8b6-785d-5ab5-ac19-52541a0b0599', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '118f78bd-464e-512e-9d26-445ad2c077b2', 'Mild', 0, true, false, 0),
  ('b6fdbce9-4491-569f-91b7-65df1b5115fa', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '118f78bd-464e-512e-9d26-445ad2c077b2', 'Regular', 0, true, true, 1),
  ('faec8f2e-11ac-5cd0-88e7-d02438ca7511', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '118f78bd-464e-512e-9d26-445ad2c077b2', 'Scotch Bonnet Hot', 0, true, false, 2),
  ('7101c7f1-dfac-5c20-bde2-1f93d9ebec26', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'eb7f43ba-77c8-54d7-bbdb-0091f95646c4', 'Mild', 0, true, false, 0),
  ('0c8b9019-8976-5fb5-9e1e-89579e52e158', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'eb7f43ba-77c8-54d7-bbdb-0091f95646c4', 'Regular', 0, true, true, 1),
  ('1a30d4c7-fea7-52e9-b2b8-a297a3a5807b', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'eb7f43ba-77c8-54d7-bbdb-0091f95646c4', 'Scotch Bonnet Hot', 0, true, false, 2),
  ('df08bd12-41da-5680-9fe5-57fe47ca25dd', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '6e3b6508-843b-524e-95fc-21a4fe0ff9a0', 'Rice & Peas', 0, true, true, 0),
  ('3ddcbfd8-b16d-5a5b-9cf8-d7b9d3b2a2b0', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '6e3b6508-843b-524e-95fc-21a4fe0ff9a0', 'White Rice', 0, true, false, 1),
  ('d1c1892f-d37b-5a8a-b9e9-58b3221de508', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '6e3b6508-843b-524e-95fc-21a4fe0ff9a0', 'Festival (2)', 0, true, false, 2),
  ('4e226cc8-b01c-5b89-be22-84b1101c100a', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '6e3b6508-843b-524e-95fc-21a4fe0ff9a0', 'Roast Breadfruit', 15000, true, false, 3),
  ('a9b61b8a-c4b7-5bae-8c33-968a149d11d9', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '6e3b6508-843b-524e-95fc-21a4fe0ff9a0', 'Bammy', 10000, true, false, 4),
  ('f0b7aaff-a30e-55ad-8f46-c47ca83170a0', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '1b0ffec5-2f05-59f6-8ee7-dd9c134c1902', 'Rice & Peas', 0, true, true, 0),
  ('31aea5df-e7bf-590d-94d1-87bb56d41140', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '1b0ffec5-2f05-59f6-8ee7-dd9c134c1902', 'White Rice', 0, true, false, 1),
  ('bc140d0a-c020-5877-bb67-ed3c0198e617', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '1b0ffec5-2f05-59f6-8ee7-dd9c134c1902', 'Festival (2)', 0, true, false, 2),
  ('205454da-6428-5130-b43f-60f5bf83a64c', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '1b0ffec5-2f05-59f6-8ee7-dd9c134c1902', 'Roast Breadfruit', 15000, true, false, 3),
  ('ddde170a-1253-574d-b9c3-abfecfde3a74', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '1b0ffec5-2f05-59f6-8ee7-dd9c134c1902', 'Bammy', 10000, true, false, 4),
  ('01ab1c96-df89-5fb5-b5e7-d92ff27d63ac', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'f83e2986-9c15-51c1-a183-ce611999f1d0', 'Rice & Peas', 0, true, true, 0),
  ('02503764-5459-5c22-9a1d-b0797acb1e72', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'f83e2986-9c15-51c1-a183-ce611999f1d0', 'White Rice', 0, true, false, 1),
  ('d5373467-15da-563b-88bc-a4ee806aebcb', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'f83e2986-9c15-51c1-a183-ce611999f1d0', 'Festival (2)', 0, true, false, 2),
  ('c14b18fc-fb3b-52ae-ba70-11a3216d4726', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'f83e2986-9c15-51c1-a183-ce611999f1d0', 'Roast Breadfruit', 15000, true, false, 3),
  ('8ce2a2bf-7e92-5bca-8618-ebdc89a6ec79', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'f83e2986-9c15-51c1-a183-ce611999f1d0', 'Bammy', 10000, true, false, 4),
  ('dea5f0b8-e3e5-5599-a34a-0cd64ec26d03', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '5eae3a79-9c60-59be-a17e-c7509f5b703c', 'Quarter', 0, true, true, 0),
  ('80fbdcf2-8ab0-5e83-b8d4-9eee173d2ca6', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '5eae3a79-9c60-59be-a17e-c7509f5b703c', 'Half', 90000, true, false, 1),
  ('e78ecbe5-2135-50c8-9ed3-711c910eb560', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'fcee7588-42bb-541b-a817-06f9dca340ca', 'Mild', 0, true, false, 0),
  ('7618fe60-8d06-5dcd-822e-ccd1a562b872', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'fcee7588-42bb-541b-a817-06f9dca340ca', 'Regular', 0, true, true, 1),
  ('edc81ef1-0ec3-53e8-947b-009babc09fac', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'fcee7588-42bb-541b-a817-06f9dca340ca', 'Scotch Bonnet Hot', 0, true, false, 2),
  ('9855fc43-7b1d-5f75-b848-5f5ab44354ad', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '340d528d-81be-5b36-b481-600e7a47c585', 'Rice & Peas', 0, true, true, 0),
  ('d6ec929c-d17e-5de6-b9f9-17cad6256bb9', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '340d528d-81be-5b36-b481-600e7a47c585', 'White Rice', 0, true, false, 1),
  ('be4e9675-59a6-540a-bac1-a22167e93119', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '340d528d-81be-5b36-b481-600e7a47c585', 'Festival (2)', 0, true, false, 2),
  ('1684f8db-1610-5508-a92d-7b89f2e25d63', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '340d528d-81be-5b36-b481-600e7a47c585', 'Roast Breadfruit', 15000, true, false, 3),
  ('fab42bdd-1aa8-5593-b96d-4fc6f3887e8c', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '340d528d-81be-5b36-b481-600e7a47c585', 'Bammy', 10000, true, false, 4),
  ('d3598a41-c7c8-5c2f-9372-d76eadb974f4', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '1f4ec026-0d62-5761-8c63-a68482679a70', 'Extra Festival', 30000, true, false, 0),
  ('bed24ec5-b1f4-5088-867b-34445e82c5d5', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '1f4ec026-0d62-5761-8c63-a68482679a70', 'Steamed Vegetables', 35000, true, false, 1),
  ('03f92123-ebf1-5250-82d6-f95ba5aa77c8', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '1f4ec026-0d62-5761-8c63-a68482679a70', 'Fried Ripe Plantain', 40000, true, false, 2),
  ('0bf15b01-2db1-5afe-991e-3a27996c3300', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '1f4ec026-0d62-5761-8c63-a68482679a70', 'Coleslaw', 25000, true, false, 3),
  ('4d19beea-26f2-5923-947c-75a333710227', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '1f4ec026-0d62-5761-8c63-a68482679a70', 'Extra Gravy', 15000, true, false, 4),
  ('95e3407d-ee3f-50fa-b894-786ef47cc844', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '4fcdf7cd-663c-5724-9d3b-87652e3b8026', 'Regular', 0, true, true, 0),
  ('8b0a319f-e235-5d71-add3-27d70e6a1bcb', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '4fcdf7cd-663c-5724-9d3b-87652e3b8026', 'Large', 110000, true, false, 1),
  ('970abe4b-f918-5307-9364-c3eb651276ba', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '098b82a2-4d74-5efa-94f5-259aafc69466', 'Rice & Peas', 0, true, true, 0),
  ('07e16bee-81a5-5867-b4e3-75f3e8c60ac6', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '098b82a2-4d74-5efa-94f5-259aafc69466', 'White Rice', 0, true, false, 1),
  ('98f949d0-e373-5c43-a682-5edfabfa2796', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '098b82a2-4d74-5efa-94f5-259aafc69466', 'Festival (2)', 0, true, false, 2),
  ('8165038e-ff6b-5d6d-aca9-99833c5e8b9e', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '098b82a2-4d74-5efa-94f5-259aafc69466', 'Roast Breadfruit', 15000, true, false, 3),
  ('e8d2f84f-6ece-519c-87c5-35060b76dbf7', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '098b82a2-4d74-5efa-94f5-259aafc69466', 'Bammy', 10000, true, false, 4),
  ('98db5c58-475e-5a2b-ab68-f08e82cd6ceb', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '2411a53b-5a9c-5bf5-bd1e-773f91716e01', 'Extra Festival', 30000, true, false, 0),
  ('8db77ee0-5965-506f-9296-99185f7ad0ed', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '2411a53b-5a9c-5bf5-bd1e-773f91716e01', 'Steamed Vegetables', 35000, true, false, 1),
  ('e4b5d232-e8d3-569e-97f5-9d7f886f1813', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '2411a53b-5a9c-5bf5-bd1e-773f91716e01', 'Fried Ripe Plantain', 40000, true, false, 2),
  ('77ad40da-dac2-5c31-ae74-4c190c0cb5bb', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '2411a53b-5a9c-5bf5-bd1e-773f91716e01', 'Coleslaw', 25000, true, false, 3),
  ('02f5e627-f791-5e93-b980-f53d64d1594b', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '2411a53b-5a9c-5bf5-bd1e-773f91716e01', 'Extra Gravy', 15000, true, false, 4),
  ('fd12d190-97e8-5ac5-9ece-a6257b303f21', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '87b3db7f-b2cf-5812-919d-0980c0478baf', 'Rice & Peas', 0, true, true, 0),
  ('84df5ab2-0091-5c0d-b4b7-925f878339d6', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '87b3db7f-b2cf-5812-919d-0980c0478baf', 'White Rice', 0, true, false, 1),
  ('983c83f9-1bac-5a9b-8d22-b3aff52cea3e', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '87b3db7f-b2cf-5812-919d-0980c0478baf', 'Festival (2)', 0, true, false, 2),
  ('0106ae0f-3ad6-5b7d-83ba-f328a9f2631f', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '87b3db7f-b2cf-5812-919d-0980c0478baf', 'Roast Breadfruit', 15000, true, false, 3),
  ('ef5e2710-ae6f-517f-8902-ae4962668d82', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '87b3db7f-b2cf-5812-919d-0980c0478baf', 'Bammy', 10000, true, false, 4),
  ('d35b8790-c1c2-5a51-9b18-e4ab10bb02b9', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'b027b5e4-de67-567b-b455-3feab4f629e6', 'Extra Festival', 30000, true, false, 0),
  ('efd0f6e6-31a9-58ad-b3c5-33d3b5ceecfe', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'b027b5e4-de67-567b-b455-3feab4f629e6', 'Steamed Vegetables', 35000, true, false, 1),
  ('66de9baa-83e7-5dac-baea-abf04e9e93e8', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'b027b5e4-de67-567b-b455-3feab4f629e6', 'Fried Ripe Plantain', 40000, true, false, 2),
  ('6b9dbd05-408e-512d-979c-cb200effb3fc', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'b027b5e4-de67-567b-b455-3feab4f629e6', 'Coleslaw', 25000, true, false, 3),
  ('672b3ec9-e654-5521-9b8f-3545eb3386bb', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'b027b5e4-de67-567b-b455-3feab4f629e6', 'Extra Gravy', 15000, true, false, 4),
  ('a236e498-0489-5747-923f-83e7981a2a91', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '1088baa4-de73-5496-8150-b7aa6950b32b', 'Rice & Peas', 0, true, true, 0),
  ('b8fa9519-63f3-53ca-a1b0-df39e4a97634', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '1088baa4-de73-5496-8150-b7aa6950b32b', 'White Rice', 0, true, false, 1),
  ('8b520cd3-cbf0-5281-a5b8-2000ebd07024', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '1088baa4-de73-5496-8150-b7aa6950b32b', 'Festival (2)', 0, true, false, 2),
  ('2f555eba-864d-5b72-9b77-d2ebf42b7b68', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '1088baa4-de73-5496-8150-b7aa6950b32b', 'Roast Breadfruit', 15000, true, false, 3),
  ('28b4852e-eb6e-58ad-a19e-d72c70453c7b', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '1088baa4-de73-5496-8150-b7aa6950b32b', 'Bammy', 10000, true, false, 4),
  ('818d9283-125a-51ed-a67f-d222d8b18155', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '7439af4f-c08f-56b9-baf6-51d6f478b7b8', 'Extra Festival', 30000, true, false, 0),
  ('e2ca9667-bb0e-5ede-9f0e-c61e52419704', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '7439af4f-c08f-56b9-baf6-51d6f478b7b8', 'Steamed Vegetables', 35000, true, false, 1),
  ('02a77087-1322-5ac7-a5b1-4d8adbf3eb4e', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '7439af4f-c08f-56b9-baf6-51d6f478b7b8', 'Fried Ripe Plantain', 40000, true, false, 2),
  ('da59f811-b3b4-5892-96dd-e1df8ef41865', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '7439af4f-c08f-56b9-baf6-51d6f478b7b8', 'Coleslaw', 25000, true, false, 3),
  ('442d4c11-9e68-5b1f-8ae0-b53c020da05c', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '7439af4f-c08f-56b9-baf6-51d6f478b7b8', 'Extra Gravy', 15000, true, false, 4),
  ('a91fa1ae-88ba-5e30-bc30-66492992475a', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'a1629493-c796-5af1-8054-dbda1966ac4a', 'Rice & Peas', 0, true, true, 0),
  ('bc0fa8fc-2221-5a7e-b417-79535f4b61d6', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'a1629493-c796-5af1-8054-dbda1966ac4a', 'White Rice', 0, true, false, 1),
  ('5b1d9096-8777-5ff7-98a1-9aeb795bf651', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'a1629493-c796-5af1-8054-dbda1966ac4a', 'Festival (2)', 0, true, false, 2),
  ('2cd47bac-e9f5-5aba-923b-0b922d223b73', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'a1629493-c796-5af1-8054-dbda1966ac4a', 'Roast Breadfruit', 15000, true, false, 3),
  ('19e59e6e-a1bf-5133-b2dc-ea262da88dc3', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'a1629493-c796-5af1-8054-dbda1966ac4a', 'Bammy', 10000, true, false, 4),
  ('cf142eca-1a05-5f1f-9b7f-39bba6fa6cf7', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'cc1b1938-2e5f-5cd7-8364-9c68071408e9', 'Extra Festival', 30000, true, false, 0),
  ('d2d67861-c80d-593d-94c7-9183c12fd696', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'cc1b1938-2e5f-5cd7-8364-9c68071408e9', 'Steamed Vegetables', 35000, true, false, 1),
  ('f97d4b98-b011-5ddb-a1dc-65b949dd44f9', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'cc1b1938-2e5f-5cd7-8364-9c68071408e9', 'Fried Ripe Plantain', 40000, true, false, 2),
  ('2c1fe1fc-de62-5c86-a9c1-d5a887c2f92d', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'cc1b1938-2e5f-5cd7-8364-9c68071408e9', 'Coleslaw', 25000, true, false, 3),
  ('0988c750-019f-5e23-8383-e4f6e605e250', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'cc1b1938-2e5f-5cd7-8364-9c68071408e9', 'Extra Gravy', 15000, true, false, 4),
  ('c01d457d-ba19-517b-a31c-aff8c0f34b87', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '14bcbcf6-5df5-5dcd-b8d3-917316904c95', 'Mild', 0, true, false, 0),
  ('da0edabd-1b21-575d-865b-31f402a536de', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '14bcbcf6-5df5-5dcd-b8d3-917316904c95', 'Regular', 0, true, true, 1),
  ('2bb617f2-d7a9-5b90-8326-228d57b8afdb', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '14bcbcf6-5df5-5dcd-b8d3-917316904c95', 'Scotch Bonnet Hot', 0, true, false, 2),
  ('b9161e4e-4222-5daa-8a3e-422920193c8e', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '234acd6d-4ae1-5c41-982f-ab7a988eb41e', 'Rice & Peas', 0, true, true, 0),
  ('c51feb2c-3ccd-5024-bd1e-644cf90915d7', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '234acd6d-4ae1-5c41-982f-ab7a988eb41e', 'White Rice', 0, true, false, 1),
  ('1a859090-fbf5-5031-be52-a03c7576cb53', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '234acd6d-4ae1-5c41-982f-ab7a988eb41e', 'Festival (2)', 0, true, false, 2),
  ('b42c0ecf-263b-508a-9726-4245f5121fd6', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '234acd6d-4ae1-5c41-982f-ab7a988eb41e', 'Roast Breadfruit', 15000, true, false, 3),
  ('67a39604-0a96-5180-bab6-67d238a426b0', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '234acd6d-4ae1-5c41-982f-ab7a988eb41e', 'Bammy', 10000, true, false, 4),
  ('16503ae6-7047-5bf3-92a6-05cb7aeac254', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'e03cf893-0846-5a7b-ae04-b7365eb412b1', 'Extra Festival', 30000, true, false, 0),
  ('e07d5f35-a6bb-5297-b115-0ffe5cf6b26d', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'e03cf893-0846-5a7b-ae04-b7365eb412b1', 'Steamed Vegetables', 35000, true, false, 1),
  ('40f9d250-8b42-52bb-b865-14024aa05bf5', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'e03cf893-0846-5a7b-ae04-b7365eb412b1', 'Fried Ripe Plantain', 40000, true, false, 2),
  ('e4c63773-3ecc-57a4-8761-8c865eee81c3', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'e03cf893-0846-5a7b-ae04-b7365eb412b1', 'Coleslaw', 25000, true, false, 3),
  ('7b86e72c-7ce9-56c6-9f0b-5d2a0bbfaffb', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'e03cf893-0846-5a7b-ae04-b7365eb412b1', 'Extra Gravy', 15000, true, false, 4),
  ('07a369e9-8e14-5cb4-ab07-db55b6fa2d86', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '8e346e15-3541-52e4-b292-7d89fc9c3e38', 'Jerk Chicken', 70000, true, false, 0),
  ('cdbb37b1-1bc2-5c8f-8483-de2fa2e9818f', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '8e346e15-3541-52e4-b292-7d89fc9c3e38', 'Shrimp', 110000, true, false, 1),
  ('6515695f-bad3-51c0-af89-64f5ab1a0190', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '2bf80a79-cfb8-5ecc-9959-d0b0cc03f0f5', 'Rice & Peas', 0, true, true, 0),
  ('c4a321d8-1659-50d1-b195-9f279b3290aa', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '2bf80a79-cfb8-5ecc-9959-d0b0cc03f0f5', 'White Rice', 0, true, false, 1),
  ('9673d2ff-a8c8-5b86-a10e-e505ff174627', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '2bf80a79-cfb8-5ecc-9959-d0b0cc03f0f5', 'Festival (2)', 0, true, false, 2),
  ('c73ef82b-0234-577b-9516-fe2896d47131', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '2bf80a79-cfb8-5ecc-9959-d0b0cc03f0f5', 'Roast Breadfruit', 15000, true, false, 3),
  ('2255990e-47a8-5d53-a4c8-6afc3d6ae4be', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '2bf80a79-cfb8-5ecc-9959-d0b0cc03f0f5', 'Bammy', 10000, true, false, 4),
  ('5ff97e68-65df-574c-8c0d-de0c0dcd5750', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '7e98e512-74b2-5807-b200-17355cefc548', 'Regular (12oz)', 0, true, true, 0),
  ('554a0ee2-0ba7-513d-8b16-5a645a294952', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '7e98e512-74b2-5807-b200-17355cefc548', 'Large (20oz)', 25000, true, false, 1),
  ('b7ccb0b5-9aa0-5c01-ad32-bb3dfb807570', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '8bbd9e03-e5bc-5633-b19f-707646241e39', 'Regular (12oz)', 0, true, true, 0),
  ('6beb034a-d94e-5d04-870d-4ff1151a4e36', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '8bbd9e03-e5bc-5633-b19f-707646241e39', 'Large (20oz)', 25000, true, false, 1),
  ('4198d48b-374d-5b77-a31f-4be3263196e3', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '17b6c853-3011-50f0-8eed-af683a6dd5ce', 'Regular (12oz)', 0, true, true, 0),
  ('6fd56813-3c0c-5db0-bb92-3f3fd8df0842', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '17b6c853-3011-50f0-8eed-af683a6dd5ce', 'Large (20oz)', 25000, true, false, 1),
  ('8484e823-5b4d-59eb-80f1-14359c43be21', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '0965d1f8-3041-566d-977d-2a7ff19e5bd6', 'Ting', 0, true, true, 0),
  ('d8a901e6-7a0f-5945-8ed5-6aafaba6b629', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '0965d1f8-3041-566d-977d-2a7ff19e5bd6', 'Kola Champagne', 0, true, false, 1),
  ('d7e3fbd6-4549-56c0-9028-30612346d39f', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '0965d1f8-3041-566d-977d-2a7ff19e5bd6', 'Cola', 0, true, false, 2),
  ('81556552-14a1-5c5a-988f-af1c479613c1', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', '84924ff7-a38c-5d0d-bbef-1c9a06b01335', 'A double', 80000, true, false, 0)
on conflict (id) do nothing;

insert into public.delivery_zones (id, restaurant_id, name, description, fee_cents, min_minutes, max_minutes, areas, radius_km, min_order_cents, is_active, sort_order) values
  ('9eec032d-f3c3-5429-bae3-bb62024dce16', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'Zone A', 'Closest neighbourhoods', 40000, 25, 40, array['New Kingston', 'Half Way Tree', 'Cross Roads', 'Liguanea', 'Hope Pastures']::text[], 4, 100000, true, 1),
  ('a2cc86e9-630a-52cb-8d04-40654c402c20', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'Zone B', 'Greater Kingston', 70000, 35, 55, array['Barbican', 'Constant Spring', 'Mona', 'Papine', 'Downtown Kingston', 'Vineyard Town', 'Meadowbrook', 'Red Hills Road']::text[], 8, 150000, true, 2),
  ('a114a61e-72a4-5515-a9db-dfd5ed319cd7', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'Zone C', 'Outer areas', 110000, 50, 75, array['Portmore', 'Stony Hill', 'Harbour View', 'Jacks Hill', 'Duhaney Park', 'Havendale']::text[], 14, 250000, true, 3)
on conflict (id) do nothing;

insert into public.promotions (id, restaurant_id, code, title, description, type, value, min_subtotal_cents, funded_by, starts_at, ends_at, usage_limit, used_count, is_active, created_at) values
  ('14753174-e467-5e99-8274-17d77fe8dd24', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'WELCOME10', '10% off your first direct order', 'Order directly from Theo''s and save 10% on food. Minimum order J$2,000.', 'percent', 1000, 200000, 'restaurant', null, null, null, 0, true, '2026-01-01T00:00:00.000Z'),
  ('e51e9566-a2c1-5400-bbc1-475009674a12', '8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'FREEDEL', 'Free delivery on orders over J$5,000', 'Delivery fee waived on Theo''s orders of J$5,000 or more.', 'free_delivery', 0, 500000, 'restaurant', null, null, null, 0, true, '2026-01-01T00:00:00.000Z')
on conflict (id) do nothing;

-- Sample lounge events, scheduled relative to when the seed runs.
insert into public.restaurant_events (restaurant_id, title, description, starts_at, is_published) values
  ('8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'Friday Night Lounge', 'Selector on the decks from 9pm, rum punch specials all night. Smart casual.', date_trunc('week', now()) + interval '4 days 26 hours', true),
  ('8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'Sunday Brunch & Live Acoustic', 'Brunch platters, sorrel mimosas and a live acoustic set from noon.', date_trunc('week', now()) + interval '6 days 16 hours', true),
  ('8e99dfd5-48fe-58ff-b05e-86a5f6f427fb', 'Wednesday Dominoes Night', 'Bring your crew. Winners'' table gets a round on the house.', date_trunc('week', now()) + interval '2 days 24 hours', true);
