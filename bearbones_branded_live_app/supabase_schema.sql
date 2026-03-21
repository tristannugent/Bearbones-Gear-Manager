-- Bearbones Gear Manager live schema
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'owner' check (role in ('owner', 'crew')),
  created_at timestamptz not null default now()
);

create table if not exists public.gear_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text not null check (category in ('lenses','cameras','lighting','audio','grip','props','miscellaneous')),
  brand text,
  model text,
  serial_number text,
  barcode text,
  location text not null default 'Office' check (location in ('Office','Studio','On Set')),
  status text not null default 'Available' check (status in ('Available','Checked Out','Maintenance','Missing')),
  notes text,
  image_url text,
  replacement_value numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gear_packages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  project_name text,
  prep_date date,
  notes text,
  status text not null default 'Draft' check (status in ('Draft','Prepped','Checked Out','Returned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.package_items (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.gear_packages(id) on delete cascade,
  gear_item_id uuid not null references public.gear_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(package_id, gear_item_id)
);

create table if not exists public.checkouts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  gear_item_id uuid not null references public.gear_items(id) on delete cascade,
  package_id uuid references public.gear_packages(id) on delete set null,
  assignee_name text,
  project_name text,
  due_back date,
  checked_out_at timestamptz not null default now(),
  returned_at timestamptz,
  notes text
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$;

create or replace trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger set_timestamp_gear_items
before update on public.gear_items
for each row execute function public.set_timestamp();

create or replace trigger set_timestamp_gear_packages
before update on public.gear_packages
for each row execute function public.set_timestamp();

alter table public.profiles enable row level security;
alter table public.gear_items enable row level security;
alter table public.gear_packages enable row level security;
alter table public.package_items enable row level security;
alter table public.checkouts enable row level security;

create policy "profiles select own" on public.profiles
for select using (auth.uid() = id);
create policy "profiles update own" on public.profiles
for update using (auth.uid() = id);

create policy "gear select own" on public.gear_items
for select using (auth.uid() = owner_id);
create policy "gear insert own" on public.gear_items
for insert with check (auth.uid() = owner_id);
create policy "gear update own" on public.gear_items
for update using (auth.uid() = owner_id);
create policy "gear delete own" on public.gear_items
for delete using (auth.uid() = owner_id);

create policy "packages select own" on public.gear_packages
for select using (auth.uid() = owner_id);
create policy "packages insert own" on public.gear_packages
for insert with check (auth.uid() = owner_id);
create policy "packages update own" on public.gear_packages
for update using (auth.uid() = owner_id);
create policy "packages delete own" on public.gear_packages
for delete using (auth.uid() = owner_id);

create policy "package items select own" on public.package_items
for select using (
  exists (
    select 1 from public.gear_packages gp
    where gp.id = package_id and gp.owner_id = auth.uid()
  )
);
create policy "package items insert own" on public.package_items
for insert with check (
  exists (
    select 1 from public.gear_packages gp
    where gp.id = package_id and gp.owner_id = auth.uid()
  )
);
create policy "package items delete own" on public.package_items
for delete using (
  exists (
    select 1 from public.gear_packages gp
    where gp.id = package_id and gp.owner_id = auth.uid()
  )
);

create policy "checkouts select own" on public.checkouts
for select using (auth.uid() = owner_id);
create policy "checkouts insert own" on public.checkouts
for insert with check (auth.uid() = owner_id);
create policy "checkouts update own" on public.checkouts
for update using (auth.uid() = owner_id);
create policy "checkouts delete own" on public.checkouts
for delete using (auth.uid() = owner_id);
