import { Blockchain } from "@/types/global";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import {
  cacheTokenDerivative,
  clearCachedTokenDerivative,
  getCachedTokenDerivative,
} from "../../lib/cache/derivative";
import {
  derivativeRequestSchema,
  derivativeResponseSchema,
} from "../../lib/derivative";

interface UseTokenDerivativeParams {
  chain: Blockchain;
  tokenAddressOrMint: string;
}

type UseTokenDerivativeOptions = Omit<
  UseQueryOptions<string, Error>,
  "queryKey" | "queryFn"
>;

async function fetchTokenDerivative({
  chain,
  tokenAddressOrMint,
}: UseTokenDerivativeParams) {
  const params = new URLSearchParams({
    chain: chain.id,
    tokenAddressOrMint,
  });

  const response = await fetch(`/api/derivative?${params.toString()}`);
  const payload = await response.json();

  if (!response.ok) {
    const errorMessage =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "Failed to fetch derivative.";

    throw new Error(errorMessage);
  }

  const parsedPayload = derivativeResponseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    throw new Error("Invalid derivative response.");
  }

  cacheTokenDerivative(
    chain.id,
    tokenAddressOrMint,
    parsedPayload.data.derivative,
  );
  return parsedPayload.data.derivative;
}

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
