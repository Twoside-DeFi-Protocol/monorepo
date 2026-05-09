import { useQuery } from "@tanstack/react-query";
import {
  clearCachedTokenDerivative,
  getCachedTokenDerivative,
} from "../../lib/cache/derivative";
import {
  UseTokenDerivativeOptions,
  UseTokenDerivativeParams,
} from "@/types/api";
import { derivativeRequestSchema } from "@/types/derivative";
import { fetchTokenDerivative } from "../../services/query/contract";

export function useTokenDerivative(
  { chain, tokenAddressOrMint }: UseTokenDerivativeParams,
  options?: UseTokenDerivativeOptions,
) {
  const isEnabled = !!chain && !!tokenAddressOrMint;

  const query = useQuery<string, Error>({
    queryKey: ["tokenDerivative", chain.id, tokenAddressOrMint],
    enabled: isEnabled,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      const parsedRequest = derivativeRequestSchema.safeParse({
        chain: chain.id,
        tokenAddressOrMint,
      });

      if (!parsedRequest.success) {
        throw new Error("Invalid derivative request.");
      }

      const cachedData = getCachedTokenDerivative(chain.id, tokenAddressOrMint);
      if (cachedData.isCached && cachedData.derivative !== null) {
        return cachedData.derivative;
      }

      return fetchTokenDerivative({ chain, tokenAddressOrMint });
    },
    ...options,
  });

  const refresh = async () => {
    clearCachedTokenDerivative(chain.id, tokenAddressOrMint);
    return query.refetch();
  };

  return {
    ...query,
    refresh,
  };
}
