import { Blockchain, CoinGeckoTokenType } from "@/types/global";
import { cacheAllTokens, getCachedAllTokens } from "../../lib/cache/tokens";
import { getTokensList } from "../../services/query/tokens";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export function useAllTokensList(blockchain: Blockchain) {
  return useQuery<CoinGeckoTokenType[] | undefined>({
    queryKey: [`allTokensList_for_${blockchain}`, blockchain],
    queryFn: async () => {
      const cachedData = getCachedAllTokens(blockchain.id);
      if (cachedData.isCached && cachedData.lockTokens)
        return cachedData.lockTokens;
      const tokens = await getTokensList(blockchain);
      cacheAllTokens(tokens, blockchain.id);
      return tokens;
    },
  });
}

export function useTokenProgram(mintAddress: string | undefined) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ["tokenProgram", mintAddress],
    queryFn: async () => {
      if (!mintAddress) return null;
      try {
        const pubkey = new PublicKey(mintAddress);
        const accountInfo = await connection.getAccountInfo(pubkey);
        if (!accountInfo) return null;

        const owner = accountInfo.owner;
        const isToken2022 = owner.equals(TOKEN_2022_PROGRAM_ID);
        return {
          programId: owner,
          isToken2022,
          isLegacy: owner.equals(TOKEN_PROGRAM_ID),
        };
      } catch (e) {
        console.error("Error fetching token program:", e);
        return null;
      }
    },
    enabled: !!mintAddress,
    staleTime: Infinity,
  });
}

