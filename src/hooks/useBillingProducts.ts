import { useQuery } from '@tanstack/react-query';

export type SubscriptionLevel = 'standard' | 'pro';

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

// Static sample product data for local development (no external billing calls).
export const sampleSubscriptions: BillingProduct[] = [
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

export const samplePacks: BillingProduct[] = [
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

export function useSubscriptionProducts() {
  return useQuery<BillingProduct[]>({
    queryKey: ['billing', 'products', 'subscription'],
    queryFn: async () => {
      // Return static local products — avoids contacting an external billing API
      return sampleSubscriptions;
    },
  });
}
