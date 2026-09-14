-- ============================================================================
-- SciFi Networks — Seed data
--
-- This file is DEMO/BOOTSTRAP data only. Do not treat as production content.
-- Safe to re-run: uses on-conflict guards.
-- ============================================================================

insert into sites (name, slug, description, network_status)
values
  ('Kemera', 'kemera', 'Kemera service area', 'operational'),
  ('Nyanchwa', 'nyanchwa', 'Nyanchwa service area', 'operational')
on conflict (name) do nothing;

-- Bootstrap owner account. Replace password_hash via the app's password
-- reset flow immediately after first deploy — this is a placeholder only.
-- (Hash below is NOT a real bcrypt hash; generate one with your auth layer.)
insert into app_users (full_name, username, email, role, is_active, must_change_password)
values ('SciFi Networks Owner', 'owner', 'owner@scifinetworks.example', 'owner', true, true)
on conflict (username) do nothing;

insert into packages (name, speed_mbps, price_kes, duration_days, description, features, is_active)
values
  ('Starter', 8, 1500.00, 30, 'Reliable browsing and streaming for individuals.', array['Up to 8 Mbps', 'Free installation survey', 'Email support'], true),
  ('Home', 15, 2500.00, 30, 'Built for households with multiple devices.', array['Up to 15 Mbps', 'Free router', 'Priority support'], true),
  ('Home Plus', 25, 3800.00, 30, 'Heavier streaming and remote work households.', array['Up to 25 Mbps', 'Free router', 'Priority support', 'Static option available'], true),
  ('Business', 50, 7500.00, 30, 'For small businesses and shared offices.', array['Up to 50 Mbps', 'Dedicated support line', 'SLA-backed uptime'], true)
on conflict do nothing;

-- attach all seeded packages to both seeded sites
insert into package_sites (package_id, site_id)
select p.id, s.id from packages p cross join sites s
on conflict do nothing;

insert into faqs (category, question, answer, sort_order)
values
  ('Getting Connected', 'How do I get connected?', 'Visit the Get Connected page, choose a package, and submit your details. We will contact you to confirm your installation date.', 1),
  ('Getting Connected', 'How long does installation take?', 'Most installations are completed within 2-5 working days of confirmation, depending on site survey results.', 2),
  ('Tracking', 'How do I track my request?', 'Use the Track page with your ticket number and the phone number or email you registered with.', 1),
  ('Payments', 'What payment methods are accepted?', 'We currently support M-Pesa. Other methods will be added as they become available.', 1),
  ('Agent Program', 'How do I become an agent?', 'Agents are appointed directly by SciFi Networks staff based on reliability and local presence. Speak to your site office to express interest.', 1)
on conflict do nothing;

insert into settings (key, value) values
  ('inventory_low_stock_default_threshold', '10'),
  ('company_contact', '{"phone": "+254700000000", "email": "support@scifinetworks.example", "whatsapp": "+254700000000"}')
on conflict (key) do nothing;
