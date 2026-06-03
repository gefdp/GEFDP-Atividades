-- GEFDP Atividades - Supabase schema
-- Execute este arquivo no SQL Editor do Supabase.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('developer', 'admin', 'user');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter type public.user_role add value if not exists 'developer' before 'admin';
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  job_title text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
drop column if exists access_password;

create table if not exists public.access_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  password text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null default 'trabalho',
  priority text not null default 'media',
  status text not null default 'pendente',
  due_date date,
  completed_date timestamptz,
  points integer not null default 10,
  assigned_to text,
  assigned_to_name text,
  created_by text,
  archived boolean not null default false,
  mood_emoji text,
  attachments jsonb not null default '[]'::jsonb,
  verification_requested_from text,
  verification_requested_from_name text,
  verified_by_owner boolean not null default false,
  verified_by_owner_name text,
  verified_by_requester boolean not null default false,
  verified_by_requester_name text,
  created_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date date not null,
  photo_url text,
  location_name text,
  location_lat double precision,
  location_lng double precision,
  created_by text,
  created_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon text,
  points_required integer not null,
  unlocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_access_credentials_updated_at on public.access_credentials;
create trigger set_access_credentials_updated_at before update on public.access_credentials
for each row execute function public.set_updated_at();

drop trigger if exists set_activities_updated_at on public.activities;
create trigger set_activities_updated_at before update on public.activities
for each row execute function public.set_updated_at();

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists set_rewards_updated_at on public.rewards;
create trigger set_rewards_updated_at before update on public.rewards
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.access_credentials enable row level security;
alter table public.activities enable row level security;
alter table public.events enable row level security;
alter table public.rewards enable row level security;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('developer', 'admin'), false)
$$;

create or replace function public.is_developer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'developer', false)
$$;

create or replace function public.delete_team_access(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not coalesce(public.current_user_role() = 'developer', false) then
    raise exception 'Apenas desenvolvedores podem apagar acessos.';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Você não pode apagar o próprio acesso.';
  end if;

  delete from auth.users
  where id = target_user_id;
end;
$$;

revoke all on function public.delete_team_access(uuid) from public;
grant execute on function public.delete_team_access(uuid) to authenticated;

create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email from auth.users where id = auth.uid()
$$;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.current_user_role() in ('developer', 'admin'))
with check (id = auth.uid() or public.current_user_role() in ('developer', 'admin'));

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles for insert
to authenticated
with check (id = auth.uid() or public.current_user_role() in ('developer', 'admin'));

drop policy if exists "profiles_delete_developer" on public.profiles;
create policy "profiles_delete_developer"
on public.profiles for delete
to authenticated
using (public.is_developer());

drop policy if exists "access_credentials_select_staff" on public.access_credentials;
create policy "access_credentials_select_staff"
on public.access_credentials for select
to authenticated
using (public.is_staff());

drop policy if exists "access_credentials_insert_staff" on public.access_credentials;
create policy "access_credentials_insert_staff"
on public.access_credentials for insert
to authenticated
with check (public.is_staff());

drop policy if exists "access_credentials_update_staff" on public.access_credentials;
create policy "access_credentials_update_staff"
on public.access_credentials for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "access_credentials_delete_staff" on public.access_credentials;
create policy "access_credentials_delete_staff"
on public.access_credentials for delete
to authenticated
using (public.is_staff());

drop policy if exists "activities_select_related_or_staff" on public.activities;
drop policy if exists "activities_select_authenticated" on public.activities;
create policy "activities_select_authenticated"
on public.activities for select
to authenticated
using (true);

drop policy if exists "activities_insert_authenticated" on public.activities;
create policy "activities_insert_authenticated"
on public.activities for insert
to authenticated
with check (true);

drop policy if exists "activities_update_related_or_staff" on public.activities;
create policy "activities_update_related_or_staff"
on public.activities for update
to authenticated
using (
  public.is_staff()
  or assigned_to = public.current_user_email()
  or created_by = public.current_user_email()
  or verification_requested_from = public.current_user_email()
)
with check (true);

drop policy if exists "activities_delete_staff" on public.activities;
create policy "activities_delete_staff"
on public.activities for delete
to authenticated
using (public.is_staff());

drop policy if exists "events_select_authenticated" on public.events;
create policy "events_select_authenticated"
on public.events for select
to authenticated
using (true);

drop policy if exists "events_write_staff" on public.events;
create policy "events_write_staff"
on public.events for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "rewards_select_authenticated" on public.rewards;
create policy "rewards_select_authenticated"
on public.rewards for select
to authenticated
using (true);

drop policy if exists "rewards_write_admin" on public.rewards;
create policy "rewards_write_admin"
on public.rewards for all
to authenticated
using (public.current_user_role() in ('developer', 'admin'))
with check (public.current_user_role() in ('developer', 'admin'));

insert into public.rewards (title, description, icon, points_required)
values
  ('Primeiros passos', 'Concluir as primeiras atividades no sistema.', 'ðŸ', 50),
  ('Ritmo constante', 'Acumular pontos mantendo entregas frequentes.', 'ðŸ”¥', 150),
  ('ReferÃªncia da equipe', 'AlcanÃ§ar desempenho destacado no ciclo.', 'ðŸ†', 300)
on conflict do nothing;

insert into storage.buckets (id, name, public, file_size_limit)
values ('gef-dp-assets', 'gef-dp-assets', true, 2097152)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists "assets_select_public" on storage.objects;
create policy "assets_select_public"
on storage.objects for select
using (bucket_id = 'gef-dp-assets');

drop policy if exists "assets_insert_authenticated" on storage.objects;
create policy "assets_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'gef-dp-assets');

drop policy if exists "assets_update_owner_or_staff" on storage.objects;
create policy "assets_update_owner_or_staff"
on storage.objects for update
to authenticated
using (bucket_id = 'gef-dp-assets' and (owner = auth.uid() or public.is_staff()))
with check (bucket_id = 'gef-dp-assets');

drop policy if exists "assets_delete_owner_or_staff" on storage.objects;
create policy "assets_delete_owner_or_staff"
on storage.objects for delete
to authenticated
using (bucket_id = 'gef-dp-assets' and (owner = auth.uid() or public.is_staff()));

