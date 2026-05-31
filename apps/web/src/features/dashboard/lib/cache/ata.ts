import { CachedAtaValue } from "@/types/cache";
import { getAtaCacheKey } from "./keys";

export function cacheTokenAta(
  tokenMint: string,
  owner: string,
  value: CachedAtaValue,
  tokenProgramId?: string,
) {
  try {
    const cacheKey = getAtaCacheKey(tokenMint, owner, tokenProgramId);
    localStorage.setItem(cacheKey, JSON.stringify(value));
  } catch (error) {
    console.error(error);
  }
}

export function getCachedTokenAta(
  tokenMint: string,
  owner: string,
  tokenProgramId?: string,
): {
  isCached: boolean;
  value: CachedAtaValue | null;
} {
  try {
    const cacheKey = getAtaCacheKey(tokenMint, owner, tokenProgramId);
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

export function clearCachedTokenAta(tokenMint: string, owner: string, tokenProgramId?: string) {
  try {
    const cacheKey = getAtaCacheKey(tokenMint, owner, tokenProgramId);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error(error);
  }
}
