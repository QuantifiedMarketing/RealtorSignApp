-- ─────────────────────────────────────────────────────────────────────────────
--  SignTrack – Supabase Schema
--  Run this entire file once in the Supabase SQL Editor:
--  https://supabase.com/dashboard/project/rsqbvqbxspqiwkmfqupp/sql/new
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. TABLES ─────────────────────────────────────────────────────────────────

-- Users / agent profiles (one row per auth.users record)
create table if not exists public.users (
  id              uuid primary key references auth.users on delete cascade,
  email           text not null,
  name            text not null,
  role            text not null default 'agent' check (role in ('agent', 'admin')),
  phone           text,
  brokerage       text,
  placard_count   integer not null default 0,
  created_at      timestamptz not null default now()
);

-- Jobs
create table if not exists public.jobs (
  id              uuid primary key default gen_random_uuid(),
  agent_id        uuid not null references public.users(id) on delete cascade,
  agent_name      text not null,
  address         text not null,
  pin_lat         float8,
  pin_lng         float8,
  preferred_date  date not null,
  notes           text not null default '',
  status          text not null default 'pending'
                    check (status in ('pending','active','completed','takedown_requested')),
  photo_uri       text,
  submitted_at    timestamptz not null default now(),
  completed_at    timestamptz,
  created_at      timestamptz not null default now()
);

-- Placard inventory (authoritative count; triggers keep users.placard_count in sync)
create table if not exists public.placard_inventory (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid not null unique references public.users(id) on delete cascade,
  count         integer not null default 0,
  last_updated  timestamptz not null default now()
);


-- ── 2. INDEXES ────────────────────────────────────────────────────────────────

create index if not exists jobs_agent_id_idx   on public.jobs(agent_id);
create index if not exists jobs_status_idx     on public.jobs(status);
create index if not exists jobs_submitted_idx  on public.jobs(submitted_at desc);


-- ── 3. TRIGGER – keep users.placard_count in sync with placard_inventory ──────

create or replace function public.sync_placard_count()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.users
  set placard_count = NEW.count
  where id = NEW.agent_id;
  return NEW;
end;
$$;

drop trigger if exists trg_sync_placard_count on public.placard_inventory;
create trigger trg_sync_placard_count
  after insert or update of count on public.placard_inventory
  for each row execute function public.sync_placard_count();


-- ── 4. HELPER – get current user's role (security definer avoids RLS recursion) ──

create or replace function public.current_user_role()
returns text
language sql
security definer stable
as $$
  select role from public.users where id = auth.uid()
$$;


-- ── 5. TRIGGER – auto-create public.users profile on new auth sign-up ────────
--
--  When a user signs up (or is created via the dashboard / SQL seed), this
--  trigger fires and inserts a matching row into public.users.
--  raw_user_meta_data should contain: { name, role, phone, brokerage }
--  Defaults: role = 'agent', placard_count = 0

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name, role, phone, brokerage, placard_count)
  values (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    coalesce(NEW.raw_user_meta_data->>'role', 'agent'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'brokerage',
    0
  )
  on conflict (id) do nothing;
  return NEW;
end;
$$;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── 6. ROW LEVEL SECURITY ─────────────────────────────────────────────────────

alter table public.users             enable row level security;
alter table public.jobs              enable row level security;
alter table public.placard_inventory enable row level security;

-- users
create policy "users: read own profile"
  on public.users for select
  using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "users: update own profile"
  on public.users for update
  using (id = auth.uid());

-- jobs
create policy "jobs: agents read own, admins read all"
  on public.jobs for select
  using (agent_id = auth.uid() or public.current_user_role() = 'admin');

create policy "jobs: agents insert own"
  on public.jobs for insert
  with check (agent_id = auth.uid());

create policy "jobs: agents update own (takedown only), admins update all"
  on public.jobs for update
  using (agent_id = auth.uid() or public.current_user_role() = 'admin');

-- placard_inventory
create policy "inventory: agents read own, admins read all"
  on public.placard_inventory for select
  using (agent_id = auth.uid() or public.current_user_role() = 'admin');

create policy "inventory: admins manage all"
  on public.placard_inventory for all
  using (public.current_user_role() = 'admin');


-- ── 7. SEED – demo users ──────────────────────────────────────────────────────
--
--  Creates two auth accounts. The handle_new_user trigger auto-creates the
--  matching public.users profile rows from raw_user_meta_data.
--  Passwords: both use 'Password123'
--
--  Safe to run multiple times (ON CONFLICT DO NOTHING).

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, recovery_token,
  email_change, email_change_token_new
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'agent@test.com',
    crypt('Password123', gen_salt('bf', 10)),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Jane Smith","role":"agent","phone":"555-123-4567","brokerage":"Smith Realty"}',
    false, '', '', '', ''
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'admin@test.com',
    crypt('Password123', gen_salt('bf', 10)),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Mike Johnson","role":"admin"}',
    false, '', '', '', ''
  )
on conflict (id) do nothing;

insert into auth.identities (id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '{"sub":"11111111-1111-1111-1111-111111111111","email":"agent@test.com"}',
    'email', now(), now(), now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '{"sub":"22222222-2222-2222-2222-222222222222","email":"admin@test.com"}',
    'email', now(), now(), now()
  )
on conflict (id) do nothing;

-- public.users rows are created by the handle_new_user trigger above.
-- These manual inserts catch the case where the trigger wasn't in place yet,
-- or the auth rows already existed before the trigger was added.
insert into public.users (id, email, name, role, phone, brokerage, placard_count)
values
  ('11111111-1111-1111-1111-111111111111', 'agent@test.com', 'Jane Smith',   'agent', '555-123-4567', 'Smith Realty', 12),
  ('22222222-2222-2222-2222-222222222222', 'admin@test.com', 'Mike Johnson', 'admin', null,           null,           0)
on conflict (id) do nothing;

insert into public.placard_inventory (agent_id, count)
values ('11111111-1111-1111-1111-111111111111', 12)
on conflict (agent_id) do nothing;
