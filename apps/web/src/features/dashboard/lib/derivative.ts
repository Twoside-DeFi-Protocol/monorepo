import { z } from "zod";
import { SupportedBlockchain } from "@/types/global";

export const derivativeRequestSchema = z.object({
  chain: z.enum(["eth", "base", "solana"] satisfies [SupportedBlockchain, ...SupportedBlockchain[]]),
  tokenAddressOrMint: z.string().trim().min(1),
});

export type DerivativeRequest = z.infer<typeof derivativeRequestSchema>;

export type DerivativeResponse = {
  derivative: string;
};

export type DerivativeErrorResponse = {
  error: string;
};

export const derivativeResponseSchema = z.object({
  derivative: z.string(),
});

export const derivativeErrorResponseSchema = z.object({
  error: z.string(),
});
