-- =====================================================
-- Migration: Allow trigger to bypass RLS when creating profiles
-- Created: 2025-11-26 20:10:00 UTC
-- Description: Recreates handle_new_user trigger to bypass RLS
--
-- Problem:
-- The authenticated_insert_profiles policy has WITH CHECK (false)
-- which blocks manual profile creation. But the trigger also needs
-- to insert profiles, and it was getting blocked by RLS.
--
-- Solution:
-- Recreate the function with explicit SET statement to bypass RLS
-- for this specific operation.
-- =====================================================

-- Drop and recreate the trigger function with RLS bypass
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a new profile with the same ID as the auth user
  -- SECURITY DEFINER ensures this runs with postgres privileges
  -- which bypasses RLS policies
  INSERT INTO public.profiles (id, created_at)
  VALUES (new.id, now());

  RETURN new;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Recreate the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile entry when a new user signs up. Runs with SECURITY DEFINER to bypass RLS policies.';
