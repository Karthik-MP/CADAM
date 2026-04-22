import { useQuery } from '@tanstack/react-query';
import type { BillingProduct } from '@/hooks/useBillingProducts';
import { samplePacks } from '@/hooks/useBillingProducts';

export function useTokenPacks() {
  return useQuery<BillingProduct[]>({
    queryKey: ['billing', 'products', 'pack'],
    queryFn: async () => {
      // Use static local packs instead of calling the billing Edge Function
      const products = samplePacks ?? [];
      return [...products].sort((a, b) => a.tokenAmount - b.tokenAmount);
    },
  });
}
