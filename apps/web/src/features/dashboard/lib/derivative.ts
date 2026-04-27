import { z } from "zod";
import { SupportedBlockchain } from "@/types/global";
import { ethers } from "ethers";
import { PublicKey } from "@solana/web3.js";

export const derivativeRequestSchema = z
  .object({
    chain: z.enum(["eth", "base", "solana"] satisfies [
      SupportedBlockchain,
      ...SupportedBlockchain[],
    ]),
    tokenAddressOrMint: z.string().trim().min(1),
  })
  .superRefine(({ chain, tokenAddressOrMint }, ctx) => {
    if (chain === "eth" || chain === "base") {
      if (!ethers.isAddress(tokenAddressOrMint)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tokenAddressOrMint"],
          message: "Invalid EVM token address.",
        });
      }
      return;
    }

    try {
      new PublicKey(tokenAddressOrMint);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tokenAddressOrMint"],
        message: "Invalid Solana mint address.",
      });
    }
  });

export type DerivativeRequest = z.infer<typeof derivativeRequestSchema>;

export const derivativeResponseSchema = z.object({
  derivative: z.string(),
});

export type DerivativeResponse = z.infer<typeof derivativeResponseSchema>;

export const derivativeErrorResponseSchema = z.object({
  error: z.string(),
});

export type DerivativeErrorResponse = z.infer<
  typeof derivativeErrorResponseSchema
>;
