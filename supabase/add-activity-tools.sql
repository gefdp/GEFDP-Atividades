-- Adiciona a coluna "tools" (ferramentas vinculadas) na tabela activities,
-- usada pelo sistema de insígnias/gamificação.
-- Execute no Supabase > SQL Editor.

alter table public.activities
add column if not exists tools jsonb not null default '[]'::jsonb;
