import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { initSentry } from '../_shared/sentry.ts';

initSentry();

Deno.serve((req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const sampleStatus = {
    user: { hasTrialed: false },
    subscription: null,
    tokens: { free: 0, subscription: 0, purchased: 0, total: 0 },
  };

  return new Response(JSON.stringify(sampleStatus), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
