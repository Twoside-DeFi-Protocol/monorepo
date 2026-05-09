export type CachedAtaValue = {
  ata: string;
  exists: boolean;
};

export type CacheKey = "all_tokens_list" | "token_derivative" | "token_ata";
