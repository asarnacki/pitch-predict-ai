-- =====================================================
-- Migration: Enable RLS with Comprehensive Policies
-- Created: 2025-11-26 14:00:00 UTC
-- Description: Re-enables Row Level Security on profiles and predictions tables
--              with comprehensive security policies for production use
--
-- Tables affected:
--   - profiles (RLS enabled with policies)
--   - predictions (RLS enabled with policies)
--
-- Security model:
--   - Anonymous users: No access to any data
--   - Authenticated users: Full CRUD access to their own data only
--   - User isolation enforced via auth.uid() = user_id check
--
-- Background:
--   Previous migrations disabled RLS for development convenience.
--   This migration restores production-ready security.
-- =====================================================

-- =====================================================
-- Enable RLS on profiles table
-- =====================================================
-- Re-enable Row Level Security that was disabled for development
-- This ensures users can only access their own profile data
-- =====================================================

alter table public.profiles enable row level security;

-- =====================================================
-- RLS Policies: profiles table (anon role)
-- =====================================================
-- Anonymous (unauthenticated) users have no access to profiles.
-- All CRUD operations are blocked for the anon role.
-- Rationale: Profile data is personal and requires authentication.
-- =====================================================

-- Policy: Prevent anonymous users from reading profiles
-- Using 'false' ensures the query will never return rows for anon users
create policy "anon_select_profiles"
  on public.profiles
  for select
  to anon
  using (false);

-- Policy: Prevent anonymous users from creating profiles
-- Profiles are created automatically via trigger on auth.users insert
create policy "anon_insert_profiles"
  on public.profiles
  for insert
  to anon
  with check (false);

-- Policy: Prevent anonymous users from updating profiles
-- Only authenticated users can modify their own profile
create policy "anon_update_profiles"
  on public.profiles
  for update
  to anon
  using (false);

-- Policy: Prevent anonymous users from deleting profiles
-- Profile deletion is handled via cascade from auth.users
create policy "anon_delete_profiles"
  on public.profiles
  for delete
  to anon
  using (false);

-- =====================================================
-- RLS Policies: profiles table (authenticated role)
-- =====================================================
-- Authenticated users can only access their own profile.
-- auth.uid() returns the current user's ID from JWT token.
-- Rationale: Ensures user data isolation and privacy.
-- =====================================================

-- Policy: Allow users to read their own profile
-- auth.uid() = id ensures users only see their own data
create policy "authenticated_select_profiles"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Policy: Prevent manual profile insertion
-- Profiles are created automatically via trigger, not manually
-- Rationale: Maintains data integrity and prevents duplicate profiles
create policy "authenticated_insert_profiles"
  on public.profiles
  for insert
  to authenticated
  with check (false);

-- Policy: Allow users to update their own profile
-- Future-proof for when profile fields are added (e.g., display_name, avatar)
create policy "authenticated_update_profiles"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id);

-- Policy: Prevent users from deleting their own profile
-- Profile deletion must go through auth.users deletion (cascade will handle it)
-- Rationale: Ensures proper cleanup and audit trail
create policy "authenticated_delete_profiles"
  on public.profiles
  for delete
  to authenticated
  using (false);

-- =====================================================
-- Enable RLS on predictions table
-- =====================================================
-- Re-enable Row Level Security that was disabled for development
-- This ensures users can only access their own predictions
-- =====================================================

alter table public.predictions enable row level security;

-- =====================================================
-- RLS Policies: predictions table (anon role)
-- =====================================================
-- Anonymous (unauthenticated) users have no access to predictions.
-- All CRUD operations are blocked for the anon role.
-- Rationale: Predictions are personal user data requiring authentication.
-- =====================================================

-- Policy: Prevent anonymous users from reading predictions
-- Predictions contain personal user choices and notes
create policy "anon_select_predictions"
  on public.predictions
  for select
  to anon
  using (false);

-- Policy: Prevent anonymous users from creating predictions
-- Only authenticated users can save predictions
create policy "anon_insert_predictions"
  on public.predictions
  for insert
  to anon
  with check (false);

-- Policy: Prevent anonymous users from updating predictions
-- Only the prediction owner can modify their predictions
create policy "anon_update_predictions"
  on public.predictions
  for update
  to anon
  using (false);

-- Policy: Prevent anonymous users from deleting predictions
-- Only the prediction owner can delete their predictions
create policy "anon_delete_predictions"
  on public.predictions
  for delete
  to anon
  using (false);

-- =====================================================
-- RLS Policies: predictions table (authenticated role)
-- =====================================================
-- Authenticated users can perform CRUD operations only on their own predictions.
-- auth.uid() = user_id ensures each user can only access their own data.
-- Rationale: Maintains user data isolation and privacy.
-- =====================================================

-- Policy: Allow users to read their own predictions
-- Used by GET /api/predictions and GET /api/predictions/:id endpoints
create policy "authenticated_select_predictions"
  on public.predictions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Allow users to create their own predictions
-- Used by POST /api/predictions endpoint
-- with check ensures user_id in INSERT must match auth.uid()
create policy "authenticated_insert_predictions"
  on public.predictions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Allow users to update their own predictions
-- Used by PATCH /api/predictions/:id endpoint
-- using clause checks existing row, with check validates new values
create policy "authenticated_update_predictions"
  on public.predictions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Allow users to delete their own predictions
-- Used by DELETE /api/predictions/:id endpoint
create policy "authenticated_delete_predictions"
  on public.predictions
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these queries to verify RLS is properly enabled:
--
-- 1. Check RLS status:
--    SELECT tablename, rowsecurity
--    FROM pg_tables
--    WHERE schemaname = 'public';
--
-- 2. List all policies:
--    SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
--    FROM pg_policies
--    WHERE schemaname = 'public';
--
-- 3. Test as authenticated user (should return only your data):
--    SELECT * FROM predictions;
--
-- 4. Test as anon (should return empty):
--    SET ROLE anon;
--    SELECT * FROM predictions;
--    RESET ROLE;
-- =====================================================
