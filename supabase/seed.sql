-- =====================================================
-- Seed Data for Development
-- Description: Creates a test user for development and testing
--
-- Test User Credentials:
--   Email: testowy@test.pl
--   Password: qwerty1!
--
-- IMPORTANT: This file is for DEVELOPMENT ONLY
-- DO NOT run this in production environment
-- =====================================================

-- Enable pgcrypto extension for password hashing
create extension if not exists pgcrypto;

-- =====================================================
-- Create Test User in auth.users
-- =====================================================
-- This creates a user in Supabase Auth with confirmed email
-- The trigger will automatically create a corresponding profile
-- =====================================================

do $$
declare
  test_user_id uuid;
begin
  -- Generate a fixed UUID for test user (for consistency across resets)
  test_user_id := '11111111-1111-1111-1111-111111111111';

  -- Delete test user if already exists (for idempotency)
  delete from auth.users where id = test_user_id;

  -- Insert test user into auth.users
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    test_user_id,
    'authenticated',
    'authenticated',
    'testowy@test.pl',
    crypt('qwerty1!', gen_salt('bf')), -- Hash password using bcrypt
    now(), -- Email is confirmed
    null,
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- Insert identity for email auth
  insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    test_user_id,
    test_user_id::text,
    format('{"sub":"%s","email":"%s"}', test_user_id::text, 'testowy@test.pl')::jsonb,
    'email',
    now(),
    now(),
    now()
  );

  -- Profile will be created automatically by the trigger
  -- Verify it was created
  if exists (select 1 from public.profiles where id = test_user_id) then
    raise notice 'Test user and profile created successfully';
    raise notice 'Email: testowy@test.pl';
    raise notice 'Password: qwerty1!';
    raise notice 'User ID: %', test_user_id;
  else
    raise exception 'Profile was not created by trigger';
  end if;
end $$;

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to verify the test user was created correctly
-- =====================================================

select
  u.id,
  u.email,
  u.email_confirmed_at is not null as email_confirmed,
  u.created_at,
  p.id as profile_id,
  p.created_at as profile_created_at
from auth.users u
left join public.profiles p on p.id = u.id
where u.email = 'testowy@test.pl';

-- =====================================================
-- Create Sample Predictions for Test User
-- =====================================================
-- Creates sample predictions for testing the API endpoints
-- =====================================================

do $$
declare
  test_user_id uuid := '11111111-1111-1111-1111-111111111111';
begin
  -- Delete existing predictions for test user (for idempotency)
  delete from public.predictions where user_id = test_user_id;

  -- Insert sample predictions
  insert into public.predictions (
    user_id,
    league,
    match_date,
    home_team,
    away_team,
    prediction_result,
    note,
    home_score,
    away_score,
    match_id
  ) values
  -- Prediction 1: Premier League match
  (
    test_user_id,
    'Premier League',
    '2025-11-05T15:00:00Z',
    'Arsenal FC',
    'Chelsea FC',
    '{"home": 0.52, "draw": 0.28, "away": 0.20}'::jsonb,
    'High confidence in home win based on recent form',
    null,
    null,
    '12345'
  ),
  -- Prediction 2: La Liga match
  (
    test_user_id,
    'La Liga',
    '2025-11-06T20:00:00Z',
    'FC Barcelona',
    'Real Madrid',
    '{"home": 0.45, "draw": 0.30, "away": 0.25}'::jsonb,
    'El Clasico - very close match expected',
    null,
    null,
    '12346'
  ),
  -- Prediction 3: Bundesliga match
  (
    test_user_id,
    'Bundesliga',
    '2025-11-07T17:30:00Z',
    'Bayern Munich',
    'Borussia Dortmund',
    '{"home": 0.60, "draw": 0.25, "away": 0.15}'::jsonb,
    'Bayern has strong home advantage',
    null,
    null,
    '12347'
  ),
  -- Prediction 4: Premier League match without note
  (
    test_user_id,
    'Premier League',
    '2025-11-08T12:30:00Z',
    'Manchester City',
    'Liverpool FC',
    '{"home": 0.48, "draw": 0.27, "away": 0.25}'::jsonb,
    null,
    null,
    null,
    '12348'
  ),
  -- Prediction 5: Completed match with scores
  (
    test_user_id,
    'Premier League',
    '2025-10-28T15:00:00Z',
    'Tottenham Hotspur',
    'Aston Villa',
    '{"home": 0.55, "draw": 0.25, "away": 0.20}'::jsonb,
    'Prediction was correct - home win!',
    2,
    1,
    '12349'
  );

  raise notice 'Sample predictions created successfully';
  raise notice 'Total predictions for test user: %', (select count(*) from public.predictions where user_id = test_user_id);
end $$;

-- =====================================================
-- Verification Query for Predictions
-- =====================================================
-- Run this to verify the predictions were created correctly
-- =====================================================

select
  id,
  league,
  home_team,
  away_team,
  match_date,
  prediction_result,
  note,
  home_score,
  away_score,
  match_id,
  created_at
from public.predictions
where user_id = '11111111-1111-1111-1111-111111111111'
order by created_at desc;

-- =====================================================
-- Usage Instructions
-- =====================================================
-- To run this seed file:
--
-- 1. Using Supabase CLI:
--    supabase db reset
--    (This will run all migrations and seed.sql automatically)
--
-- 2. Using psql:
--    psql -U postgres -d postgres -f supabase/seed.sql
--
-- 3. Using Supabase SQL Editor:
--    Copy and paste this file content into SQL Editor and run
--
-- After running, you can login with:
--   Email: testowy@test.pl
--   Password: qwerty1!
--
-- Sample Prediction IDs will be auto-generated (likely 1, 2, 3, 4, 5)
-- Test the endpoint with: GET /api/predictions/1
-- =====================================================
