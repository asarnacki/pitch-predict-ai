-- =====================================================
-- Migration: Fix trigger permissions for profile creation
-- Created: 2025-11-26 20:00:00 UTC
-- Description: Ensures trigger can insert into profiles table
-- =====================================================

-- Grant INSERT permission on profiles to postgres role (for trigger)
GRANT INSERT ON public.profiles TO postgres;

-- Ensure trigger function has proper permissions
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;
