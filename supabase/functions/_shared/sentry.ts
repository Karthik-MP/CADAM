// Lightweight Sentry shim: avoid top-level `npm:` imports so local
// Supabase edge runtime doesn't fail to boot when npm resolution isn't
// available. In production we'll attempt to dynamically import Sentry.

// deno-lint-ignore no-explicit-any
let Sentry: any = undefined;

export function initSentry() {
  const env = Deno.env.get('ENVIRONMENT') ?? 'development';
  if (env === 'local' || !Deno.env.get('SENTRY_DSN')) {
    // No-op in local development or when DSN is not provided
    Sentry = undefined;
    return;
  }

  // Dynamically import to avoid top-level import errors in runtimes
  // that don't support npm: specifier resolution during build.
  (async () => {
    try {
      const mod = await import('npm:@sentry/deno');
      Sentry = mod;
      Sentry.init({
        dsn: Deno.env.get('SENTRY_DSN') ?? '',
        defaultIntegrations: false,
        tracesSampleRate: 0.1,
        environment: env,
      });
    } catch (err) {
      // If import fails, leave Sentry undefined and continue.
      console.warn('Sentry init skipped:', err?.message ?? err);
      Sentry = undefined;
    }
  })();
}

// Log errors with context for edge function failures. Always log to
// console; optionally forward to Sentry when available.
export function logError(
  error: Error | unknown,
  context: {
    functionName: string;
    statusCode: number;
    userId?: string;
    conversationId?: string;
    additionalContext?: Record<string, unknown>;
  },
) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;

  if (Sentry && typeof Sentry.captureException === 'function') {
    try {
      Sentry.captureException(error, {
        tags: {
          function: context.functionName,
          statusCode: context.statusCode.toString(),
          environment: Deno.env.get('ENVIRONMENT') ?? 'development',
        },
        extra: {
          userId: context.userId,
          conversationId: context.conversationId,
          errorMessage,
          errorStack,
          ...context.additionalContext,
        },
        level: context.statusCode >= 500 ? 'error' : 'warning',
      });
    } catch (e) {
      console.warn('Sentry capture failed:', e?.message ?? e);
    }
  }

  console.error(`[${context.functionName}] Error (${context.statusCode}):`, {
    error: errorMessage,
    userId: context.userId,
    conversationId: context.conversationId,
    additionalContext: context.additionalContext,
  });
}

// Log API errors with additional context
export function logApiError(
  error: Error | unknown,
  context: {
    functionName: string;
    apiName: string;
    statusCode: number;
    userId?: string;
    conversationId?: string;
    requestData?: Record<string, unknown>;
  },
) {
  logError(error, {
    functionName: context.functionName,
    statusCode: context.statusCode,
    userId: context.userId,
    conversationId: context.conversationId,
    additionalContext: {
      apiName: context.apiName,
      requestData: context.requestData,
    },
  });
}
