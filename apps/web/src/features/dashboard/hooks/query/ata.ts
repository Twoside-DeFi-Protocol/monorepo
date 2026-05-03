import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import {
  ataRequestSchema,
  ataResponseSchema,
  type AtaResponse,
} from "../../lib/ata";
import {
  cacheTokenAta,
  clearCachedTokenAta,
  getCachedTokenAta,
} from "../../lib/cache/ata";

type UseTokenAtaParams = {
  tokenMint: string;
  owner: string;
};

type UseTokenAtaOptions = Omit<
  UseQueryOptions<AtaResponse, Error>,
  "queryKey" | "queryFn"
>;

async function fetchTokenAta({ tokenMint, owner }: UseTokenAtaParams) {
  const params = new URLSearchParams({
    tokenMint,
    owner,
  });

  const response = await fetch(`/api/ata?${params.toString()}`);
  const payload = await response.json();

  if (response.status == 200) {
    const parsedPayload = ataResponseSchema.safeParse(payload);
    if (!parsedPayload.success) {
      throw new Error("Invalid ATA response.");
    }

    cacheTokenAta(tokenMint, owner, parsedPayload.data.data);

    return parsedPayload.data.data;
  } else {
    throw new Error(payload.error);
  }
}

export function useTokenAta(
  { tokenMint, owner }: UseTokenAtaParams,
  options?: UseTokenAtaOptions,
) {
  const enabled = !!tokenMint && !!owner;

  const query = useQuery<AtaResponse, Error>({
    queryKey: ["tokenAta", tokenMint, owner],
    enabled,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      const parsedRequest = ataRequestSchema.safeParse({
        tokenMint,
        owner,
      });

      if (!parsedRequest.success) {
        throw new Error("Invalid ATA request.");
      }

      const cachedData = getCachedTokenAta(tokenMint, owner);
      if (cachedData.isCached && cachedData.value !== null) {
        return { data: cachedData.value };
      }

      const result = await fetchTokenAta({ tokenMint, owner });
      return { data: result };
    },
    ...options,
  });

  const refresh = async () => {
    clearCachedTokenAta(tokenMint, owner);
    return query.refetch();
  };

  return {
    ...query,
    refresh,
  };
}
