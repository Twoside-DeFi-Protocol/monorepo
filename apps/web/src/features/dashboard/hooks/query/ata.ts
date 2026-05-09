import { useQuery } from "@tanstack/react-query";
import { UseTokenAtaOptions, UseTokenAtaParams } from "@/types/api";
import { ataRequestSchema, AtaResponse } from "@/types/ata";
import { clearCachedTokenAta, getCachedTokenAta } from "../../lib/cache/ata";
import { fetchTokenAta } from "../../services/query/ata";

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
