import { CachedAtaValue } from "@/types/cache";
import { getAtaCacheKey } from "./keys";

export function cacheTokenAta(
  tokenMint: string,
  owner: string,
  value: CachedAtaValue,
) {
  try {
    const cacheKey = getAtaCacheKey(tokenMint, owner);
    localStorage.setItem(cacheKey, JSON.stringify(value));
  } catch (error) {
    console.error(error);
  }
}

export function getCachedTokenAta(
  tokenMint: string,
  owner: string,
): {
  isCached: boolean;
  value: CachedAtaValue | null;
} {
  try {
    const cacheKey = getAtaCacheKey(tokenMint, owner);
    const cachedValue = localStorage.getItem(cacheKey);
    if (!cachedValue) {
      return { isCached: false, value: null };
    }

    const parsedValue = JSON.parse(cachedValue) as CachedAtaValue;
    if (
      typeof parsedValue.ata !== "string" ||
      typeof parsedValue.exists !== "boolean"
    ) {
      return { isCached: false, value: null };
    }

    return {
      isCached: true,
      value: parsedValue,
    };
  } catch (error) {
    console.error(error);
    return { isCached: false, value: null };
  }
}

export function clearCachedTokenAta(tokenMint: string, owner: string) {
  try {
    const cacheKey = getAtaCacheKey(tokenMint, owner);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error(error);
  }
}
