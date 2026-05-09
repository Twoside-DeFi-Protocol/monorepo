import { UseQueryOptions } from "@tanstack/react-query";
import { Blockchain } from "./global";
import { AtaResponse } from "./ata";

export type UseTokenAtaParams = {
  tokenMint: string;
  owner: string;
};

export type UseTokenAtaOptions = Omit<
  UseQueryOptions<AtaResponse, Error>,
  "queryKey" | "queryFn"
>;

export interface UseTokenDerivativeParams {
  chain: Blockchain;
  tokenAddressOrMint: string;
}

export type UseTokenDerivativeOptions = Omit<
  UseQueryOptions<string, Error>,
  "queryKey" | "queryFn"
>;
