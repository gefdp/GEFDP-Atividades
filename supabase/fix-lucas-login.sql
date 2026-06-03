-- ============================================================
-- FIX: Corrigir login de usuários com email não confirmado
-- Execute este script no Supabase > SQL Editor
-- ============================================================

-- 1. Confirma o email de TODOS os usuários que têm perfil mas email não confirmado
--    (corrige o erro "Invalid login credentials" no login)
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE id IN (SELECT id FROM public.profiles)
  AND email_confirmed_at IS NULL;

-- 2. Verifica o estado atual dos usuários (rode para confirmar o resultado)
SELECT
  u.id,
  u.email,
  p.full_name,
  p.role,
  u.email_confirmed_at IS NOT NULL AS email_confirmado,
  u.last_sign_in_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at;
