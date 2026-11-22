-- =====================================================================
-- FIX SUPABASE AUTH 500 ERROR: DROP AUTH TRIGGER
-- Run this in your Supabase SQL Editor to remove the failing database trigger.
-- =====================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
