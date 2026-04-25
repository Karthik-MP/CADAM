import {
  createClient,
  SupabaseClient as DefaultSupabaseClient,
  SupabaseClientOptions,
} from 'https://esm.sh/@supabase/supabase-js@2.49.9';
import { Database } from '@shared/database.ts';

export type SupabaseClient = DefaultSupabaseClient<Database>;

export function getServiceRoleSupabaseClient(
  options?: SupabaseClientOptions<'public'>,
): SupabaseClient {
  const supabaseUrl =
    Deno.env.get('FUNCTIONS_SUPABASE_URL') ??
    Deno.env.get('SUPABASE_URL') ??
    '';
  const serviceRoleKey =
    Deno.env.get('FUNCTIONS_SUPABASE_SERVICE_ROLE_KEY') ??
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    '';

  return createClient<Database, 'public', Database['public']>(
    supabaseUrl,
    serviceRoleKey,
    {
      ...options,
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

export function getAnonSupabaseClient(
  options?: SupabaseClientOptions<'public'>,
): SupabaseClient {
  const supabaseUrl =
    Deno.env.get('FUNCTIONS_SUPABASE_URL') ??
    Deno.env.get('SUPABASE_URL') ??
    '';
  const anonKey =
    Deno.env.get('FUNCTIONS_SUPABASE_ANON_KEY') ??
    Deno.env.get('SUPABASE_ANON_KEY') ??
    '';

  return createClient<Database, 'public', Database['public']>(
    supabaseUrl,
    anonKey,
    options,
  );
}
