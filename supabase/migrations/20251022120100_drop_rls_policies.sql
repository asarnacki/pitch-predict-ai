-- =====================================================
-- Migration: Drop RLS Policies
-- Created: 2025-10-22 12:01:00 UTC
-- Description: Removes all RLS policies from profiles and predictions tables
-- 
-- Tables affected:
--   - profiles (RLS policies removed)
--   - predictions (RLS policies removed)
--
-- WARNING: DESTRUCTIVE OPERATION
-- This migration removes all Row Level Security policies.
-- After running this migration, RLS will still be enabled on tables,
-- but no policies will exist, effectively blocking all access
-- until new policies are created.
-- =====================================================

-- =====================================================
-- Drop RLS Policies: profiles table
-- =====================================================
-- Removing all policies for anonymous users
-- This will block all anonymous access to profiles
-- =====================================================

drop policy if exists "Anonymous users cannot select profiles" on public.profiles;
drop policy if exists "Anonymous users cannot insert profiles" on public.profiles;
drop policy if exists "Anonymous users cannot update profiles" on public.profiles;
drop policy if exists "Anonymous users cannot delete profiles" on public.profiles;

-- =====================================================
-- Drop RLS Policies: profiles table (authenticated users)
-- =====================================================
-- Removing all policies for authenticated users
-- This will block all authenticated user access to profiles
-- until new policies are created
-- =====================================================

drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users cannot insert profiles manually" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users cannot delete their own profile" on public.profiles;

-- =====================================================
-- Drop RLS Policies: predictions table
-- =====================================================
-- Removing all policies for anonymous users
-- This will block all anonymous access to predictions
-- =====================================================

drop policy if exists "Anonymous users cannot select predictions" on public.predictions;
drop policy if exists "Anonymous users cannot insert predictions" on public.predictions;
drop policy if exists "Anonymous users cannot update predictions" on public.predictions;
drop policy if exists "Anonymous users cannot delete predictions" on public.predictions;

-- =====================================================
-- Drop RLS Policies: predictions table (authenticated users)
-- =====================================================
-- Removing all policies for authenticated users
-- This will block all authenticated user access to predictions
-- until new policies are created
-- =====================================================

drop policy if exists "Users can view their own predictions" on public.predictions;
drop policy if exists "Users can insert their own predictions" on public.predictions;
drop policy if exists "Users can update their own predictions" on public.predictions;
drop policy if exists "Users can delete their own predictions" on public.predictions;

-- =====================================================
-- Important Notes:
-- =====================================================
-- 1. RLS remains ENABLED on both tables (profiles and predictions)
-- 2. With no policies in place, ALL access will be BLOCKED by default
-- 3. To restore access, you need to create new RLS policies
-- 4. Service role (supabase_admin) can still access data
-- =====================================================

