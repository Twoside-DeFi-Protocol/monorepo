import { SupportedBlockchain } from "@/types/global";
import { getCacheKey } from "./keys";

type CachedDerivativeValue = {
  derivative: string;
};

function getDerivativeCacheKey(
  blockchain: SupportedBlockchain,
  tokenAddressOrMint: string,
) {
  const cachePrefix = getCacheKey("token_derivative", blockchain);
  return `${cachePrefix}_${tokenAddressOrMint.toLowerCase()}`;
}

export function cacheTokenDerivative(
  blockchain: SupportedBlockchain,
  tokenAddressOrMint: string,
  derivative: string,
) {
  try {
    const cacheKey = getDerivativeCacheKey(blockchain, tokenAddressOrMint);
    const payload: CachedDerivativeValue = { derivative };
    localStorage.setItem(cacheKey, JSON.stringify(payload));
  } catch (error) {
    console.error(error);
  }
}

export function getCachedTokenDerivative(
  blockchain: SupportedBlockchain,
  tokenAddressOrMint: string,
): {
  isCached: boolean;
  derivative: string | null;
} {
  try {
    const cacheKey = getDerivativeCacheKey(blockchain, tokenAddressOrMint);
    const cachedValue = localStorage.getItem(cacheKey);
    if (!cachedValue) {
      return { isCached: false, derivative: null };
    }

    const parsedValue = JSON.parse(cachedValue) as CachedDerivativeValue;
    if (typeof parsedValue.derivative !== "string") {
      return { isCached: false, derivative: null };
    }

    return {
      isCached: true,
      derivative: parsedValue.derivative,
    };
  } catch (error) {
    console.error(error);
    return { isCached: false, derivative: null };
  }
}

export function clearCachedTokenDerivative(
  blockchain: SupportedBlockchain,
  tokenAddressOrMint: string,
) {
  try {
    const cacheKey = getDerivativeCacheKey(blockchain, tokenAddressOrMint);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error(error);
  }
}
