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
  leader_music_url text,
  leader_message text,
  job_title text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
drop column if exists access_password;

alter table public.profiles
add column if not exists leader_message text;

alter table public.profiles
drop constraint if exists profiles_leader_message_length;

alter table public.profiles
add constraint profiles_leader_message_length
check (char_length(coalesce(leader_message, '')) <= 90);

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
  difficulty text not null default 'facil',
  status text not null default 'pendente',
  due_date date,
  completed_date timestamptz,
  points integer not null default 10,
  assigned_to text,
  assigned_to_name text,
  created_by text,
  archived boolean not null default false,
  mood_emoji text,
  tools jsonb not null default '[]'::jsonb,
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

create table if not exists public.leader_alerts (
  id uuid primary key default gen_random_uuid(),
  leader_user_id uuid references public.profiles(id) on delete set null,
  leader_email text not null,
  leader_name text,
  leader_avatar_url text,
  leader_music_url text,
  message text check (char_length(coalesce(message, '')) <= 90),
  points integer not null default 0,
  previous_leader_email text,
  created_at timestamptz not null default now()
);

create index if not exists leader_alerts_created_at_idx
on public.leader_alerts (created_at desc);

create table if not exists public.prize_alerts (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references public.profiles(id) on delete cascade,
  sender_email text not null,
  sender_name text,
  sender_avatar_url text,
  sender_music_url text,
  message text check (char_length(coalesce(message, '')) <= 90),
  uses_remaining integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists prize_alerts_created_at_idx
on public.prize_alerts (created_at desc);

create index if not exists prize_alerts_sender_user_id_idx
on public.prize_alerts (sender_user_id);

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
alter table public.leader_alerts enable row level security;
alter table public.prize_alerts enable row level security;

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

create or replace function public.create_leader_alert_if_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_leader record;
  last_leader_email text;
begin
  select
    p.id,
    scores.email,
    coalesce(p.full_name, split_part(scores.email, '@', 1)) as full_name,
    p.avatar_url,
    p.leader_music_url,
    nullif(trim(p.leader_message), '') as leader_message,
    scores.total_points
  into current_leader
  from (
    select
      coalesce(a.assigned_to, a.created_by) as email,
      sum(coalesce(a.points, 10))::integer as total_points
    from public.activities a
    where a.status = 'concluida'
      and coalesce(a.assigned_to, a.created_by) is not null
    group by coalesce(a.assigned_to, a.created_by)
  ) scores
  left join public.profiles p on p.email = scores.email
  order by scores.total_points desc, scores.email asc
  limit 1;

  if current_leader.email is null or current_leader.total_points <= 0 then
    return new;
  end if;

  select la.leader_email
  into last_leader_email
  from public.leader_alerts la
  order by la.created_at desc
  limit 1;

  if last_leader_email is distinct from current_leader.email then
    insert into public.leader_alerts (
      leader_user_id,
      leader_email,
      leader_name,
      leader_avatar_url,
      leader_music_url,
      message,
      points,
      previous_leader_email
    )
    values (
      current_leader.id,
      current_leader.email,
      current_leader.full_name,
      current_leader.avatar_url,
      current_leader.leader_music_url,
      current_leader.leader_message,
      current_leader.total_points,
      last_leader_email
    );
  end if;

  return new;
end;
$$;

drop trigger if exists create_leader_alert_on_completed_activity_insert on public.activities;
create trigger create_leader_alert_on_completed_activity_insert
after insert on public.activities
for each row
when (new.status = 'concluida')
execute function public.create_leader_alert_if_changed();

drop trigger if exists create_leader_alert_on_activity_update on public.activities;
create trigger create_leader_alert_on_activity_update
after update of status, points, assigned_to, created_by on public.activities
for each row
when (new.status = 'concluida' or old.status = 'concluida')
execute function public.create_leader_alert_if_changed();

create or replace function public.create_prize_alert()
returns public.prize_alerts
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles%rowtype;
  alert_row public.prize_alerts%rowtype;
  used_count integer;
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  select *
  into profile_row
  from public.profiles
  where id = auth.uid();

  if profile_row.id is null then
    raise exception 'Perfil nao encontrado.';
  end if;

  select count(*)::integer
  into used_count
  from public.prize_alerts
  where sender_user_id = auth.uid();

  if used_count >= 3 then
    raise exception 'Voce ja usou seus 3 premios.';
  end if;

  insert into public.prize_alerts (
    sender_user_id,
    sender_email,
    sender_name,
    sender_avatar_url,
    sender_music_url,
    message,
    uses_remaining
  )
  values (
    profile_row.id,
    profile_row.email,
    coalesce(profile_row.full_name, split_part(profile_row.email, '@', 1)),
    profile_row.avatar_url,
    profile_row.leader_music_url,
    nullif(trim(profile_row.leader_message), ''),
    greatest(0, 2 - used_count)
  )
  returning * into alert_row;

  return alert_row;
end;
$$;

revoke all on function public.create_prize_alert() from public;
grant execute on function public.create_prize_alert() to authenticated;

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

drop policy if exists "leader_alerts_select_authenticated" on public.leader_alerts;
create policy "leader_alerts_select_authenticated"
on public.leader_alerts for select
to authenticated
using (true);

drop policy if exists "leader_alerts_delete_staff" on public.leader_alerts;
create policy "leader_alerts_delete_staff"
on public.leader_alerts for delete
to authenticated
using (public.is_staff());

drop policy if exists "prize_alerts_select_authenticated" on public.prize_alerts;
create policy "prize_alerts_select_authenticated"
on public.prize_alerts for select
to authenticated
using (true);

drop policy if exists "prize_alerts_delete_staff" on public.prize_alerts;
create policy "prize_alerts_delete_staff"
on public.prize_alerts for delete
to authenticated
using (public.is_staff());

do $$
begin
  alter publication supabase_realtime add table public.leader_alerts;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.prize_alerts;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

insert into public.rewards (title, description, icon, points_required)
values
  ('Primeiros passos', 'Concluir as primeiras atividades no sistema.', 'ðŸ', 50),
  ('Ritmo constante', 'Acumular pontos mantendo entregas frequentes.', 'ðŸ”¥', 150),
  ('ReferÃªncia da equipe', 'AlcanÃ§ar desempenho destacado no ciclo.', 'ðŸ†', 300)
on conflict do nothing;

insert into storage.buckets (id, name, public, file_size_limit)
values ('gef-dp-assets', 'gef-dp-assets', true, 10485760)
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

