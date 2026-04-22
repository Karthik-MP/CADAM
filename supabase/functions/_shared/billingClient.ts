// Stub billing client for local development.
// Replaces calls to an external adam-billing service with local no-op
// implementations that return sensible defaults so callers continue to work
// without an external dependency.

export type SubscriptionLevel = 'standard' | 'pro';

export type BillingStatus = {
  user: {
    hasTrialed: boolean;
  };
  subscription: {
    level: SubscriptionLevel;
    status: string | null;
    currentPeriodEnd: string | null;
  } | null;
  tokens: {
    free: number;
    subscription: number;
    purchased: number;
    total: number;
  };
};

export type ConsumeSuccess = {
  ok: true;
  tokensDeducted: number;
  freeBalance: number;
  subscriptionBalance: number;
  purchasedBalance: number;
  totalBalance: number;
};

export type ConsumeFailure = {
  ok: false;
  reason: 'insufficient_tokens';
  tokensRequired: number;
  tokensAvailable: number;
  tokensDeducted: number;
};

export type ConsumeResult = ConsumeSuccess | ConsumeFailure;

export type RefundResult = {
  ok: true;
  tokensRefunded: number;
  source: 'subscription' | 'purchased';
  freeBalance: number;
  subscriptionBalance: number;
  purchasedBalance: number;
  totalBalance: number;
};

export type BillingProduct = {
  id: string;
  stripeProductId: string;
  stripePriceId: string;
  productType: 'subscription' | 'pack';
  subscriptionLevel: SubscriptionLevel | null;
  tokenAmount: number;
  name: string;
  priceCents: number;
  interval: string | null;
  active: boolean;
};

export class BillingClientError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(message: string, status = 502, body: unknown = undefined) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// Sample product data used by the stub.
const sampleSubscriptions: BillingProduct[] = [
  {
    id: 'sub-monthly',
    stripeProductId: 'prod_sub',
    stripePriceId: 'price_month',
    productType: 'subscription',
    subscriptionLevel: 'standard',
    tokenAmount: 100,
    name: 'Standard Monthly',
    priceCents: 999,
    interval: 'month',
    active: true,
  },
];

const samplePacks: BillingProduct[] = [
  {
    id: 'pack-small',
    stripeProductId: 'prod_pack',
    stripePriceId: 'price_pack',
    productType: 'pack',
    subscriptionLevel: null,
    tokenAmount: 10,
    name: 'Small Pack',
    priceCents: 199,
    interval: null,
    active: true,
  },
];

type ConsumeBody = {
  tokens: number;
  operation?: string;
  referenceId?: string;
};

type RefundBody = {
  tokens: number;
  operation?: string;
  referenceId?: string;
};

type CheckoutBody = {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialPeriodDays?: number;
};

type CancelSubscriptionBody = {
  feedback?:
    | 'customer_service'
    | 'low_quality'
    | 'missing_features'
    | 'other'
    | 'switched_service'
    | 'too_complex'
    | 'too_expensive'
    | 'unused';
  comment?: string;
};

export type CancelSubscriptionResult =
  | { canceled: true }
  | { canceled: false; reason: 'no_subscription' | 'already_canceled' };

export const billing = {
  // deno-lint-ignore require-await
  getStatus: async (_email: string): Promise<BillingStatus> => ({
    user: { hasTrialed: false },
    subscription: null,
    tokens: { free: 0, subscription: 0, purchased: 0, total: 0 },
  }),

  // deno-lint-ignore require-await
  consume: async (
    _email: string,
    body: ConsumeBody,
  ): Promise<ConsumeResult> => {
    return {
      ok: true,
      tokensDeducted: body.tokens,
      freeBalance: 0,
      subscriptionBalance: 0,
      purchasedBalance: 0,
      totalBalance: 0,
    };
  },

  // deno-lint-ignore require-await
  refund: async (_email: string, body: RefundBody): Promise<RefundResult> => ({
    ok: true,
    tokensRefunded: body.tokens,
    source: 'purchased',
    freeBalance: 0,
    subscriptionBalance: 0,
    purchasedBalance: 0,
    totalBalance: 0,
  }),

  // deno-lint-ignore require-await
  createCheckout: async (_email: string, _body: CheckoutBody) => ({
    url: 'https://example.com/checkout',
  }),

  // deno-lint-ignore require-await
  createPortal: async (_email: string, _body: { returnUrl: string }) => ({
    url: 'https://example.com/portal',
  }),

  // deno-lint-ignore require-await
  cancelSubscription: async (
    _email: string,
    _body: CancelSubscriptionBody = {},
  ) =>
    ({
      canceled: false,
      reason: 'no_subscription',
    }) as CancelSubscriptionResult,

  // deno-lint-ignore require-await
  getProductsByType: async (type: 'subscription' | 'pack') =>
    type === 'subscription' ? sampleSubscriptions : samplePacks,

  // deno-lint-ignore require-await
  getAllProducts: async () => ({
    subscriptions: sampleSubscriptions,
    packs: samplePacks,
  }),
};
