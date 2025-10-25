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
-- =====================================================
