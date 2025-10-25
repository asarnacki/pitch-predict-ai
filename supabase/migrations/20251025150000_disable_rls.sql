-- =====================================================
-- Migration: Disable RLS completely
-- Created: 2025-10-25 15:00:00 UTC
-- Description: Disables Row Level Security on all tables for development
--
-- WARNING: This should only be used in development!
-- In production, RLS should be enabled with proper policies.
-- =====================================================

-- Disable RLS on profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on predictions table
ALTER TABLE public.predictions DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- Verification
-- =====================================================
-- After running this migration:
-- 1. RLS is completely disabled on both tables
-- 2. All queries will work without policy checks
-- 3. Perfect for development and testing
-- =====================================================
