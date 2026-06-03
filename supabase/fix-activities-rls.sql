-- Permite que todos os usuários autenticados vejam todas as atividades.
-- Antes, apenas staff ou o próprio responsável via as atividades.
-- Execute no Supabase > SQL Editor.

drop policy if exists "activities_select_related_or_staff" on public.activities;
create policy "activities_select_authenticated"
on public.activities for select
to authenticated
using (true);
