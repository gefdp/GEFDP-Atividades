-- Adiciona a coluna "difficulty" (dificuldade) na tabela activities,
-- usada para somar pontos de prioridade + dificuldade.
-- Execute no Supabase > SQL Editor.

alter table public.activities
add column if not exists difficulty text not null default 'facil';
