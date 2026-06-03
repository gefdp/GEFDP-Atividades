-- GEFDP Atividades - migração para o modelo de 3 perfis.
-- Rode o BLOCO 1 primeiro. Depois de aparecer "Success", rode o BLOCO 2.
--
-- EXECUTAR NO SUPABASE:
-- 1. Abra o Supabase > SQL Editor.
-- 2. Copie e execute o BLOCO 1 primeiro.
-- 3. Depois que aparecer "Success", copie e execute o BLOCO 2 inteiro.
-- 4. O BLOCO 2 e a parte que cria a tabela de senhas, libera o olho/editar/apagar
--    e define Rayllon como Desenvolvedor.

-- =========================
-- BLOCO 1 - execute primeiro
-- =========================
alter type public.user_role add value if not exists 'developer' before 'admin';
alter type public.user_role add value if not exists 'user';

-- ==========================================
-- BLOCO 2 - execute depois do BLOCO 1
-- COPIE DAQUI ATE O FINAL DO ARQUIVO
-- ==========================================
alter table public.profiles
drop column if exists access_password;

create table if not exists public.access_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  password text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

drop trigger if exists set_access_credentials_updated_at on public.access_credentials;
create trigger set_access_credentials_updated_at before update on public.access_credentials
for each row execute function public.set_updated_at();

alter table public.access_credentials enable row level security;

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

drop policy if exists "rewards_write_admin" on public.rewards;
create policy "rewards_write_admin"
on public.rewards for all
to authenticated
using (public.current_user_role() in ('developer', 'admin'))
with check (public.current_user_role() in ('developer', 'admin'));

update public.profiles
set
  role = 'user'::public.user_role,
  updated_at = now()
where role::text not in ('developer', 'admin', 'user');

update public.profiles
set
  role = 'developer'::public.user_role,
  updated_at = now()
where lower(email) = lower('rayllon122@gmail.com');

-- Confirma os e-mails dos usuarios criados pela tela de acessos.
-- Sem isso, o Supabase Auth pode retornar "Invalid login credentials" no login.
update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now())
where id in (
  select id
  from public.profiles
);
