-- ==========================================================
-- DriftMint — Production PostgreSQL & RLS Schema (Supabase)
-- ==========================================================

create extension if not exists "pgcrypto";

-- 1. Agency / Freelancer Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  agency_name text not null default 'My Studio',
  default_hourly_rate_cents integer not null default 15000 check (default_hourly_rate_cents >= 1000),
  currency text not null default 'USD' check (currency in ('USD', 'EUR', 'GBP', 'CAD')),
  plan_tier text not null default 'free' check (plan_tier in ('free', 'starter', 'studio', 'founding_lifetime')),
  subscription_status text not null default 'inactive' check (subscription_status in ('inactive', 'active', 'past_due', 'canceled', 'lifetime')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  monthly_analyses_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Client Projects & Original SOW Baselines
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  client_name text not null,
  client_email text not null,
  hourly_rate_cents integer not null check (hourly_rate_cents >= 1000),
  currency text not null default 'USD' check (currency in ('USD', 'EUR', 'GBP', 'CAD')),
  original_sow text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Scope Drift Analyses
create table if not exists public.scope_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  project_name text not null,
  client_message text not null,
  original_sow text not null,
  is_out_of_scope boolean not null,
  drift_score integer not null check (drift_score between 0 and 100),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  summary text not null,
  violated_clauses jsonb not null default '[]'::jsonb,
  requested_deliverables jsonb not null default '[]'::jsonb,
  total_estimated_hours numeric(6,2) not null default 0,
  recommended_amount_cents integer not null default 0,
  currency text not null default 'USD',
  reply_drafts jsonb not null default '[]'::jsonb,
  engine_source text not null default 'openai',
  created_at timestamptz not null default now()
);

-- 4. Client Change Orders (Publicly Signable & Payable via Token)
create table if not exists public.change_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  analysis_id uuid references public.scope_analyses (id) on delete set null,
  public_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  agency_name text not null,
  project_name text not null,
  client_name text not null,
  client_email text not null,
  title text not null,
  summary text not null,
  deliverables jsonb not null default '[]'::jsonb,
  estimated_hours numeric(6,2) not null,
  amount_cents integer not null check (amount_cents >= 100),
  currency text not null default 'USD' check (currency in ('USD', 'EUR', 'GBP', 'CAD')),
  status text not null default 'sent' check (status in ('draft', 'sent', 'approved', 'paid', 'declined')),
  client_signature_name text,
  client_signature_ip text,
  approved_at timestamptz,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Stripe Webhook Idempotency Log
create table if not exists public.stripe_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_projects_user_id on public.projects (user_id);
create index if not exists idx_analyses_user_id on public.scope_analyses (user_id, created_at desc);
create index if not exists idx_change_orders_user_id on public.change_orders (user_id, created_at desc);
create index if not exists idx_change_orders_token on public.change_orders (public_token);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists trg_change_orders_updated_at on public.change_orders;
create trigger trg_change_orders_updated_at
  before update on public.change_orders
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, agency_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'agency_name', 'My Studio')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.scope_analyses enable row level security;
alter table public.change_orders enable row level security;
alter table public.stripe_events enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users manage own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own scope analyses"
  on public.scope_analyses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own change orders"
  on public.change_orders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
