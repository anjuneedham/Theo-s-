-- FICTIONAL demo partner restaurants for trying the marketplace. Do not load in production.

insert into public.restaurants (id, tagline, description, region_id, phone, email, whatsapp, address_line, area, city, parish, country, latitude, longitude, timezone, currency, logo_url, cover_url, status, is_anchor, is_featured, plan_id, commission_rate_bps, accepts_delivery, accepts_pickup, min_order_cents, prep_time_minutes, rating_avg, rating_count, social_instagram, social_facebook, social_tiktok, created_at, slug, name) values
  ('d653ba99-6b2b-5085-8834-280492d52898', 'Fresh fish, fried or steamed, the Port Royal way.', 'Demo partner listing. Fried fish, bammy and festival, steamed fish with okra and crackers.', 'ffa794e5-db3b-5480-9404-b52b810463ef', null, null, null, null, null, 'Portmore', 'St. Catherine', 'JM', 17.955, -76.883, 'America/Jamaica', 'JMD', null, null, 'active', false, true, 'e288df22-246f-584f-9652-de59388d6afb', null, true, true, 0, 30, 0, 0, null, null, null, '2026-01-01T00:00:00.000Z', 'harbour-catch', 'Harbour Catch'),
  ('da29ae39-3779-5435-bc41-0afb11bed863', 'Plant-powered Rastafarian cooking.', 'Demo partner listing. Ital stew, callaloo wraps and fresh juices — no meat, no salt added.', 'accd19e1-7a54-5f39-b598-fde736087fc5', null, null, null, null, null, 'Kingston', 'St. Andrew', 'JM', 18.03, -76.79, 'America/Jamaica', 'JMD', null, null, 'active', false, false, 'fc09c6be-8ae0-549c-8b54-f5abb3529a83', null, true, true, 0, 20, 0, 0, null, null, null, '2026-01-01T00:00:00.000Z', 'ital-garden', 'Ital Garden Kitchen'),
  ('821b2913-20f3-5dfc-97cd-10f134fe845c', 'Flaky patties & coco bread, baked all day.', 'Demo partner listing. Beef, chicken, callaloo and lobster patties with coco bread.', '3c66d843-1c4d-5e74-a04e-06198acfac97', null, null, null, null, null, 'Montego Bay', 'St. James', 'JM', 18.4762, -77.8939, 'America/Jamaica', 'JMD', null, null, 'active', false, false, 'fc09c6be-8ae0-549c-8b54-f5abb3529a83', null, true, true, 0, 10, 0, 0, null, null, null, '2026-01-01T00:00:00.000Z', 'bay-patty-co', 'Bay Patty Co.')
on conflict (id) do nothing;

insert into public.restaurant_category_assignments (id, restaurant_id, category_id) values
  ('699964c6-d5b7-5abe-a870-f0de09c1978d', 'd653ba99-6b2b-5085-8834-280492d52898', '228aa5a1-4591-5240-90a0-e7876f250dc0'),
  ('56209087-9a43-5fbd-a992-f01fac720ba6', 'd653ba99-6b2b-5085-8834-280492d52898', '4630e714-9c75-586c-8c13-7a0da919d584'),
  ('d819a333-737a-5062-a558-15e68d010124', 'da29ae39-3779-5435-bc41-0afb11bed863', '1efeb436-e4d1-53db-8603-7282517541c9'),
  ('6ea0fa6a-e46e-5fa5-967f-3ac69c6d4acd', 'da29ae39-3779-5435-bc41-0afb11bed863', '4630e714-9c75-586c-8c13-7a0da919d584'),
  ('7e243c4d-5a65-5890-b3b2-2df66fa34685', '821b2913-20f3-5dfc-97cd-10f134fe845c', 'f159b0e0-ddcc-544a-a30a-14192589b6c0'),
  ('92b81744-e9ee-5b3f-a659-32b0eb21d368', '821b2913-20f3-5dfc-97cd-10f134fe845c', '555be721-8b87-5575-be20-cb26366a9467')
on conflict (id) do nothing;

insert into public.operating_hours (id, restaurant_id, day_of_week, opens_at, closes_at, is_closed) values
  ('1bcb436a-ae33-5a8a-87aa-fec00358f269', 'd653ba99-6b2b-5085-8834-280492d52898', 0, '11:00', '21:00', false),
  ('6b9b1206-32e8-5568-b2dc-75ae3463d3ee', 'd653ba99-6b2b-5085-8834-280492d52898', 1, '11:00', '21:00', false),
  ('94c675af-20e7-58e2-95fe-9b2fecbb3e0f', 'd653ba99-6b2b-5085-8834-280492d52898', 2, '11:00', '21:00', false),
  ('92a07793-d8ba-5904-bbef-7bbe42b12f0d', 'd653ba99-6b2b-5085-8834-280492d52898', 3, '11:00', '21:00', false),
  ('3895c870-35d9-5928-8de3-f98f456b1e11', 'd653ba99-6b2b-5085-8834-280492d52898', 4, '11:00', '21:00', false),
  ('18e6eb1a-36dc-5d2e-8cea-6cd93f5d3e56', 'd653ba99-6b2b-5085-8834-280492d52898', 5, '11:00', '21:00', false),
  ('23ea1e93-9604-5528-ad0b-823fb421c56f', 'd653ba99-6b2b-5085-8834-280492d52898', 6, '11:00', '21:00', false),
  ('e45ee515-75e0-57ef-986a-6a4299ff5b58', 'da29ae39-3779-5435-bc41-0afb11bed863', 0, '00:00', '00:00', true),
  ('15a504e6-a736-5987-9deb-b01f45ed8af9', 'da29ae39-3779-5435-bc41-0afb11bed863', 1, '09:00', '19:00', false),
  ('ac732820-a6bb-5571-8a8a-6dfbc8912b71', 'da29ae39-3779-5435-bc41-0afb11bed863', 2, '09:00', '19:00', false),
  ('1d538bdd-6676-587c-994e-ae10405ed489', 'da29ae39-3779-5435-bc41-0afb11bed863', 3, '09:00', '19:00', false),
  ('361c64f9-1d96-5ea3-925e-979ccbf466b8', 'da29ae39-3779-5435-bc41-0afb11bed863', 4, '09:00', '19:00', false),
  ('babe53f4-c796-563b-9a3d-fb1af174c9b4', 'da29ae39-3779-5435-bc41-0afb11bed863', 5, '09:00', '19:00', false),
  ('2a6cc903-2279-5d51-8b7e-ba2ccd108827', 'da29ae39-3779-5435-bc41-0afb11bed863', 6, '09:00', '19:00', false),
  ('404570e9-13f7-5f85-827a-c383eab8a9d1', '821b2913-20f3-5dfc-97cd-10f134fe845c', 0, '07:00', '20:00', false),
  ('f2487ff2-5f45-5e8f-82d4-d049a966023d', '821b2913-20f3-5dfc-97cd-10f134fe845c', 1, '07:00', '20:00', false),
  ('beeca537-9a39-5ea7-a083-a1b0613fff0a', '821b2913-20f3-5dfc-97cd-10f134fe845c', 2, '07:00', '20:00', false),
  ('60c1d6dc-e2f5-559b-b35a-d927762b84ef', '821b2913-20f3-5dfc-97cd-10f134fe845c', 3, '07:00', '20:00', false),
  ('c5e343da-321e-567e-b8fe-88e630a7739f', '821b2913-20f3-5dfc-97cd-10f134fe845c', 4, '07:00', '20:00', false),
  ('9466a6a7-89aa-57bf-b47e-9eeb958982d7', '821b2913-20f3-5dfc-97cd-10f134fe845c', 5, '07:00', '20:00', false),
  ('563c48c2-2b34-5102-afc5-f335044f11e2', '821b2913-20f3-5dfc-97cd-10f134fe845c', 6, '07:00', '20:00', false)
on conflict (id) do nothing;

insert into public.menu_categories (id, restaurant_id, name, slug, description, sort_order, is_active, available_from, available_until) values
  ('a453fb89-e84e-5561-aa73-f96c8f486c92', 'd653ba99-6b2b-5085-8834-280492d52898', 'Fish', 'fish', null, 0, true, null, null),
  ('37b28991-8f35-5435-ac70-f659788d33c3', 'd653ba99-6b2b-5085-8834-280492d52898', 'Sides & Drinks', 'sides-and-drinks', null, 1, true, null, null),
  ('e0890a02-2bef-5506-894f-3bf074c4bf5e', 'da29ae39-3779-5435-bc41-0afb11bed863', 'Ital Plates', 'ital-plates', null, 0, true, null, null),
  ('6d2affb1-2ecc-59fe-a971-77da56553319', 'da29ae39-3779-5435-bc41-0afb11bed863', 'Juices', 'juices', null, 1, true, null, null),
  ('2a597f6d-4eeb-5d19-a102-9c6b15e2d6d0', '821b2913-20f3-5dfc-97cd-10f134fe845c', 'Patties', 'patties', null, 0, true, null, null),
  ('8cb65f1f-dfdb-58a1-8380-810130da2d05', '821b2913-20f3-5dfc-97cd-10f134fe845c', 'Bakery', 'bakery', null, 1, true, null, null)
on conflict (id) do nothing;

insert into public.menu_items (id, restaurant_id, category_id, name, description, price_cents, image_url, is_available, is_featured, dietary_tags, spice_level, sort_order, created_at) values
  ('29561bbb-f875-55c1-bfa6-feb6274be729', 'd653ba99-6b2b-5085-8834-280492d52898', 'a453fb89-e84e-5561-aa73-f96c8f486c92', 'Fried Fish & Bammy', 'Whole fried parrot fish with bammy and pickled pepper.', 260000, null, true, true, '{}'::text[], 0, 0, '2026-01-01T00:00:00.000Z'),
  ('7037287f-ca9e-520b-a069-8334ecd448ba', 'd653ba99-6b2b-5085-8834-280492d52898', 'a453fb89-e84e-5561-aa73-f96c8f486c92', 'Steamed Fish', 'Fish steamed with okra, pumpkin and water crackers.', 280000, null, true, false, '{}'::text[], 0, 1, '2026-01-01T00:00:00.000Z'),
  ('6b997d53-0987-53cc-984f-2ee80e4b2a95', 'd653ba99-6b2b-5085-8834-280492d52898', 'a453fb89-e84e-5561-aa73-f96c8f486c92', 'Curry Shrimp', 'Shrimp in a coconut curry sauce.', 290000, null, true, false, '{}'::text[], 1, 2, '2026-01-01T00:00:00.000Z'),
  ('5084ddb2-d69a-5152-b2a7-660de954385f', 'd653ba99-6b2b-5085-8834-280492d52898', '37b28991-8f35-5435-ac70-f659788d33c3', 'Festival (3)', 'Sweet fried dumplings.', 35000, null, true, false, '{}'::text[], 0, 0, '2026-01-01T00:00:00.000Z'),
  ('61ba902e-95dd-5ab5-a9ef-e73ad37f19ad', 'd653ba99-6b2b-5085-8834-280492d52898', '37b28991-8f35-5435-ac70-f659788d33c3', 'Bag Juice', 'Ice-cold fruit punch.', 20000, null, true, false, '{}'::text[], 0, 1, '2026-01-01T00:00:00.000Z'),
  ('423cb63a-7a41-58b7-b7e6-41d8e29e4311', 'da29ae39-3779-5435-bc41-0afb11bed863', 'e0890a02-2bef-5506-894f-3bf074c4bf5e', 'Ital Stew', 'Pumpkin, chocho, carrot, dumplings and red peas in coconut milk.', 140000, null, true, true, array['vegan']::text[], 0, 0, '2026-01-01T00:00:00.000Z'),
  ('c5fc9b89-c78c-5acb-b153-21a4d328f2ae', 'da29ae39-3779-5435-bc41-0afb11bed863', 'e0890a02-2bef-5506-894f-3bf074c4bf5e', 'Callaloo Wrap', 'Steamed callaloo, chickpeas and avocado in a whole-wheat wrap.', 120000, null, true, false, array['vegan']::text[], 0, 1, '2026-01-01T00:00:00.000Z'),
  ('f5424d8c-a25c-5924-82f3-e77a79fdbd89', 'da29ae39-3779-5435-bc41-0afb11bed863', 'e0890a02-2bef-5506-894f-3bf074c4bf5e', 'Tofu Jerk Bowl', 'Jerk tofu, brown rice & peas, steamed veg.', 150000, null, true, false, array['vegan']::text[], 2, 2, '2026-01-01T00:00:00.000Z'),
  ('90bfff77-3bde-5d81-9fef-8946fd4cafae', 'da29ae39-3779-5435-bc41-0afb11bed863', '6d2affb1-2ecc-59fe-a971-77da56553319', 'Beetroot & Ginger', 'Cold-pressed.', 65000, null, true, false, array['vegan']::text[], 0, 0, '2026-01-01T00:00:00.000Z'),
  ('aeb51670-99cf-5a45-ad8c-9fe3e9f6f148', 'da29ae39-3779-5435-bc41-0afb11bed863', '6d2affb1-2ecc-59fe-a971-77da56553319', 'Soursop Punch', 'Blended with oat milk and nutmeg.', 70000, null, true, false, array['vegan']::text[], 0, 1, '2026-01-01T00:00:00.000Z'),
  ('21beb6d0-0323-5325-a055-d6f714c88bd5', '821b2913-20f3-5dfc-97cd-10f134fe845c', '2a597f6d-4eeb-5d19-a102-9c6b15e2d6d0', 'Beef Patty', 'Spicy minced beef in a flaky golden crust.', 35000, null, true, true, '{}'::text[], 1, 0, '2026-01-01T00:00:00.000Z'),
  ('242b3d9f-c73b-58ac-a053-1732c065853d', '821b2913-20f3-5dfc-97cd-10f134fe845c', '2a597f6d-4eeb-5d19-a102-9c6b15e2d6d0', 'Chicken Patty', 'Curried chicken filling.', 38000, null, true, false, '{}'::text[], 0, 1, '2026-01-01T00:00:00.000Z'),
  ('7c3b93c6-5020-5b14-a171-e1d0f639e035', '821b2913-20f3-5dfc-97cd-10f134fe845c', '2a597f6d-4eeb-5d19-a102-9c6b15e2d6d0', 'Callaloo Patty', 'Seasoned callaloo.', 33000, null, true, false, array['vegetarian']::text[], 0, 2, '2026-01-01T00:00:00.000Z'),
  ('1e5b1b43-b2a2-5677-bc02-036fd99bb20b', '821b2913-20f3-5dfc-97cd-10f134fe845c', '2a597f6d-4eeb-5d19-a102-9c6b15e2d6d0', 'Lobster Patty', 'Seasonal lobster filling.', 90000, null, true, false, '{}'::text[], 0, 3, '2026-01-01T00:00:00.000Z'),
  ('325988fa-5c68-5f8c-b65d-20681141f50a', '821b2913-20f3-5dfc-97cd-10f134fe845c', '8cb65f1f-dfdb-58a1-8380-810130da2d05', 'Coco Bread', 'Soft, buttery, folded.', 20000, null, true, false, '{}'::text[], 0, 0, '2026-01-01T00:00:00.000Z'),
  ('5231711a-96e7-5f1c-8609-a201a5f60963', '821b2913-20f3-5dfc-97cd-10f134fe845c', '8cb65f1f-dfdb-58a1-8380-810130da2d05', 'Bulla & Cheese', 'Spiced molasses bulla with processed cheese.', 30000, null, true, false, '{}'::text[], 0, 1, '2026-01-01T00:00:00.000Z')
on conflict (id) do nothing;

insert into public.menu_item_modifier_groups (id, restaurant_id, menu_item_id, name, min_select, max_select, sort_order) values
  ('755e6a27-ec70-5fa9-95b6-8f9184465bdb', 'd653ba99-6b2b-5085-8834-280492d52898', '29561bbb-f875-55c1-bfa6-feb6274be729', 'Choose your side', 1, 1, 0),
  ('fd3d9f00-9fdf-5a2d-8955-3004a831fcd9', 'd653ba99-6b2b-5085-8834-280492d52898', '7037287f-ca9e-520b-a069-8334ecd448ba', 'Choose your side', 1, 1, 0),
  ('d12594be-c6cf-5117-adfd-13478d244517', 'd653ba99-6b2b-5085-8834-280492d52898', '6b997d53-0987-53cc-984f-2ee80e4b2a95', 'Choose your side', 1, 1, 0),
  ('9b22410d-be17-50ea-a936-ed480be047d3', '821b2913-20f3-5dfc-97cd-10f134fe845c', '21beb6d0-0323-5325-a055-d6f714c88bd5', 'Make it', 0, 1, 0)
on conflict (id) do nothing;

insert into public.menu_item_modifiers (id, restaurant_id, group_id, name, price_delta_cents, is_available, is_default, sort_order) values
  ('b7f9a84d-cab2-56b3-988b-d341e976e7f8', 'd653ba99-6b2b-5085-8834-280492d52898', '755e6a27-ec70-5fa9-95b6-8f9184465bdb', 'Rice & Peas', 0, true, true, 0),
  ('cae61a58-407b-5103-ae50-94c6b58cbce3', 'd653ba99-6b2b-5085-8834-280492d52898', '755e6a27-ec70-5fa9-95b6-8f9184465bdb', 'White Rice', 0, true, false, 1),
  ('57878c1f-95c7-5ff2-8b23-23db3f7bf2a7', 'd653ba99-6b2b-5085-8834-280492d52898', '755e6a27-ec70-5fa9-95b6-8f9184465bdb', 'Festival (2)', 0, true, false, 2),
  ('beddb42e-699b-5c67-980e-06cf9b73e68c', 'd653ba99-6b2b-5085-8834-280492d52898', '755e6a27-ec70-5fa9-95b6-8f9184465bdb', 'Roast Breadfruit', 15000, true, false, 3),
  ('d6681498-9ec1-570e-8e6b-a29bb9b7f284', 'd653ba99-6b2b-5085-8834-280492d52898', '755e6a27-ec70-5fa9-95b6-8f9184465bdb', 'Bammy', 10000, true, false, 4),
  ('796fea12-4401-5ee0-a6e1-d9db1d80b6ce', 'd653ba99-6b2b-5085-8834-280492d52898', 'fd3d9f00-9fdf-5a2d-8955-3004a831fcd9', 'Rice & Peas', 0, true, true, 0),
  ('c542ccbe-8c0f-5444-9d64-82cc8c0c2c20', 'd653ba99-6b2b-5085-8834-280492d52898', 'fd3d9f00-9fdf-5a2d-8955-3004a831fcd9', 'White Rice', 0, true, false, 1),
  ('cef64411-5b13-543c-a9d3-7edb44e5ef02', 'd653ba99-6b2b-5085-8834-280492d52898', 'fd3d9f00-9fdf-5a2d-8955-3004a831fcd9', 'Festival (2)', 0, true, false, 2),
  ('d741ed52-a8cd-5c8b-8bf8-58414cd42e4c', 'd653ba99-6b2b-5085-8834-280492d52898', 'fd3d9f00-9fdf-5a2d-8955-3004a831fcd9', 'Roast Breadfruit', 15000, true, false, 3),
  ('64ccc037-0bc0-51c8-bfb3-d433eeab2922', 'd653ba99-6b2b-5085-8834-280492d52898', 'fd3d9f00-9fdf-5a2d-8955-3004a831fcd9', 'Bammy', 10000, true, false, 4),
  ('7450048e-fa0d-5095-8638-667431af168b', 'd653ba99-6b2b-5085-8834-280492d52898', 'd12594be-c6cf-5117-adfd-13478d244517', 'Rice & Peas', 0, true, true, 0),
  ('821b3c52-bc56-555b-9f47-fe617c9d92e6', 'd653ba99-6b2b-5085-8834-280492d52898', 'd12594be-c6cf-5117-adfd-13478d244517', 'White Rice', 0, true, false, 1),
  ('9ea71a03-6ec6-592e-a571-63d9894a6e95', 'd653ba99-6b2b-5085-8834-280492d52898', 'd12594be-c6cf-5117-adfd-13478d244517', 'Festival (2)', 0, true, false, 2),
  ('ac4e816f-a373-5b34-a7af-a3883a77c586', 'd653ba99-6b2b-5085-8834-280492d52898', 'd12594be-c6cf-5117-adfd-13478d244517', 'Roast Breadfruit', 15000, true, false, 3),
  ('1bbd9a2e-b16c-55b3-b1a6-3357c876568a', 'd653ba99-6b2b-5085-8834-280492d52898', 'd12594be-c6cf-5117-adfd-13478d244517', 'Bammy', 10000, true, false, 4),
  ('30d0d36b-86db-53ad-8699-82e36b08f290', '821b2913-20f3-5dfc-97cd-10f134fe845c', '9b22410d-be17-50ea-a936-ed480be047d3', 'With Coco Bread', 20000, true, false, 0),
  ('2cc47c8b-0314-5508-bf09-883a1627ea97', '821b2913-20f3-5dfc-97cd-10f134fe845c', '9b22410d-be17-50ea-a936-ed480be047d3', 'With Cheese', 15000, true, false, 1)
on conflict (id) do nothing;

insert into public.delivery_zones (id, restaurant_id, name, description, fee_cents, min_minutes, max_minutes, areas, radius_km, min_order_cents, is_active, sort_order) values
  ('2fcd6cfe-2c14-57b8-af97-641d702229ed', 'd653ba99-6b2b-5085-8834-280492d52898', 'Portmore', null, 45000, 30, 50, array['Portmore', 'Hellshire', 'Waterford', 'Edgewater', 'Braeton']::text[], 7, 120000, true, 1),
  ('d3257f73-f100-51a4-9cce-04420ac09f37', 'da29ae39-3779-5435-bc41-0afb11bed863', 'Uptown', null, 50000, 30, 50, array['Liguanea', 'Mona', 'Papine', 'Hope Pastures', 'Half Way Tree', 'New Kingston']::text[], 6, 100000, true, 1),
  ('d413b01a-fd9b-5ee5-959c-bf67bdcc0822', '821b2913-20f3-5dfc-97cd-10f134fe845c', 'Montego Bay', null, 35000, 20, 40, array['Montego Bay', 'Ironshore', 'Rose Hall', 'Catherine Hall', 'Freeport']::text[], 8, 80000, true, 1)
on conflict (id) do nothing;

