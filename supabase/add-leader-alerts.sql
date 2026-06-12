-- Adiciona alertas compartilhados de liderança.
-- Execute no Supabase > SQL Editor.

create extension if not exists "pgcrypto";

alter table public.profiles
add column if not exists leader_message text;

alter table public.profiles
drop constraint if exists profiles_leader_message_length;

alter table public.profiles
add constraint profiles_leader_message_length
check (char_length(coalesce(leader_message, '')) <= 90);

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

alter table public.leader_alerts enable row level security;

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

do $$
begin
  alter publication supabase_realtime add table public.leader_alerts;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
