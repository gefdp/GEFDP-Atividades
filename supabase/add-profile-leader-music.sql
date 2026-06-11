-- Adiciona a música de líder ao perfil do usuário.
-- Execute no Supabase > SQL Editor.

alter table public.profiles
add column if not exists leader_music_url text;

update storage.buckets
set file_size_limit = 10485760
where id = 'gef-dp-assets';
