-- =====================================================================
-- FIX SUPABASE AUTH 'Database error granting user'
-- Run this in your Supabase SQL Editor
-- =====================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS tr_auth_users ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
