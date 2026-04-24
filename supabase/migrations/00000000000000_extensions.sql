-- Required extensions for GoTrue auth
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS storage;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;

-- Roles required by GoTrue and PostgREST
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    CREATE ROLE supabase_auth_admin NOINHERIT LOGIN PASSWORD 'postgres';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_storage_admin') THEN
    CREATE ROLE supabase_storage_admin NOINHERIT LOGIN PASSWORD 'postgres';
  END IF;
END$$;

GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO postgres;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO postgres;

ALTER ROLE supabase_auth_admin SET search_path = auth;

-- Pre-create GoTrue enum types in auth schema.
-- GoTrue's add_mfa_schema migration creates these without a schema prefix,
-- which places them in whatever search_path is active (usually public).
-- Later migrations reference auth.factor_type explicitly and fail.
-- Pre-creating them here in auth ensures consistency regardless of search_path.
DO $$ BEGIN
  CREATE TYPE auth.factor_type AS ENUM('totp', 'webauthn', 'phone');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE auth.factor_status AS ENUM('unverified', 'verified');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE auth.aal_level AS ENUM('aal1', 'aal2', 'aal3');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE auth.code_challenge_method AS ENUM('s256', 'plain');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE auth.one_time_token_type AS ENUM(
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
