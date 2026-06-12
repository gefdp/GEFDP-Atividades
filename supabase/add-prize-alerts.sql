-- Adiciona o botao de premio com limite de 3 usos por usuario.
-- Execute no Supabase > SQL Editor.

create extension if not exists "pgcrypto";

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

alter table public.prize_alerts enable row level security;

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

do $$
begin
  alter publication supabase_realtime add table public.prize_alerts;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
