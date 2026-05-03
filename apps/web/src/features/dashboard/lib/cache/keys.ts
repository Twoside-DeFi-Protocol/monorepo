import { SupportedBlockchain } from "@/types/global";

export type CacheKey = "all_tokens_list" | "token_derivative" | "token_ata";

export function getCacheKey(
  cacheKey: CacheKey,
  blockchainParam: SupportedBlockchain,
) {
  return `twoside:${blockchainParam}:${cacheKey}`;
}

export function getCacheTimestampKey(
  cacheKey: CacheKey,
  blockchainParam: SupportedBlockchain,
) {
  return `twoside:${blockchainParam}:${cacheKey}:timestamp`;
}

export function getAtaCacheKey(tokenMint: string, owner: string) {
  const cachePrefix = getCacheKey("token_ata", "solana");
  return `${cachePrefix}:${tokenMint.toLowerCase()}:${owner.toLowerCase()}`;
}

export function getDerivativeCacheKey(
  blockchain: SupportedBlockchain,
  tokenAddressOrMint: string,
) {
  const cachePrefix = getCacheKey("token_derivative", blockchain);
  return `${cachePrefix}:${tokenAddressOrMint.toLowerCase()}`;
}
