import { Blockchain } from "@/types/global";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { ethers } from "ethers";
import { envVariables } from "@/lib/envVariables";
import { getTokenDerivativePDA } from "../../lib/sol/utils";
import { PublicKey } from "@solana/web3.js";
import { Twoside } from "../../lib/sol/idlType";
import { Program } from "@coral-xyz/anchor";

interface UseTokenBalanceParams {
  chain: Blockchain;
  tokenAddressOrMint: string;
  program?: Program<Twoside>;
}

export function useTokenDerivative(
  { chain, tokenAddressOrMint, program }: UseTokenBalanceParams,
  options?: UseQueryOptions<string, Error>,
) {
  return useQuery<string, Error>({
    queryKey: ["tokenDerivative", chain, tokenAddressOrMint],
    enabled:
      !!chain &&
      !!tokenAddressOrMint &&
      (chain.id !== "solana" || !!program),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      switch (chain.id) {
        case "eth":
        case "base": {
          const rpcUrl =
            chain.name === "Ethereum"
              ? process.env.NEXT_PUBLIC_ETH_RPC_URL!
              : process.env.NEXT_PUBLIC_BASE_RPC_URL!;
          const provider = new ethers.JsonRpcProvider(rpcUrl);

          const abi = [
            "function tokenDerivatives(address token) view returns (address)",
          ];

          const twosideContract =
            chain.id == "eth"
              ? envVariables.twosideContract.eth
              : envVariables.twosideContract.base;
          if (twosideContract == "") {
            throw new Error("Twoside contract address not set.");
          }

          const contract = new ethers.Contract(twosideContract, abi, provider);

          console.log("Blockchain: ", chain.name);
          console.log("Twoside Contract: ", twosideContract);
          console.log("Token: ", tokenAddressOrMint);

          const tokenDerivative =
            await contract.tokenDerivatives(tokenAddressOrMint);
          return String(tokenDerivative);
        }
        case "solana": {
          if (!program) {
            throw new Error("Solana program is not initialized.");
          }

          const { pda } = getTokenDerivativePDA(new PublicKey(tokenAddressOrMint));
          console.log(`Token Info PDA - ${pda.toBase58()}`);

          try {
            const account = await program.account.tokenInfo.fetch(pda);
            console.log(
              `Token Info Account (Original Mint) - ${account.originalMint}`,
            );
            console.log(
              `Token Info Account (Derivative Mint) - ${account.derivativeMint}`,
            );
            return account.derivativeMint.toString();
          } catch {
            return "";
          }
        }

        default:
          throw new Error(`Unsupported chain: ${chain.id}`);
      }
    },
    ...options,
  });
}
