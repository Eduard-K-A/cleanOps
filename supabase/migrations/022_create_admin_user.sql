-- Migration: Create an initial Admin user
-- Description: Seeds the auth.users and public.profiles tables with an admin user if it doesn't already exist.

DO $$
DECLARE
  admin_uid UUID := gen_random_uuid();
BEGIN
  -- Ensure pgcrypto is available for the crypt() function
  CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

  -- Check if the admin user already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'Admin@gmail.com') THEN
    -- 1. Insert into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'Admin@gmail.com',
      crypt('Admin@123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- 2. Insert into auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      admin_uid,
      admin_uid::text,
      format('{"sub":"%s","email":"%s"}', admin_uid::text, 'Admin@gmail.com')::jsonb,
      'email',
      now(),
      now(),
      now()
    );

    -- 3. Insert into public.profiles
    INSERT INTO public.profiles (
      id,
      role,
      full_name,
      email,
      onboarding_completed
    ) VALUES (
      admin_uid,
      'admin',
      'System Administrator',
      'Admin@gmail.com',
      TRUE
    ) ON CONFLICT (id) DO UPDATE SET
      role = EXCLUDED.role,
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      onboarding_completed = EXCLUDED.onboarding_completed;

  END IF;
END $$;
