import { z } from "zod";
import { PublicKey } from "@solana/web3.js";

export const ataRequestSchema = z
  .object({
    tokenMint: z.string().trim().min(1),
    owner: z.string().trim().min(1),
  })
  .superRefine(({ tokenMint, owner }, ctx) => {
    try {
      new PublicKey(tokenMint);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tokenMint"],
        message: "Invalid Solana mint address.",
      });
    }

    try {
      new PublicKey(owner);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["owner"],
        message: "Invalid Solana owner address.",
      });
    }
  });

export type AtaRequest = z.infer<typeof ataRequestSchema>;

export const ataResponseSchema = z.object({
  ata: z.string(),
  exists: z.boolean(),
});

export type AtaResponse = z.infer<typeof ataResponseSchema>;

export const ataErrorResponseSchema = z.object({
  error: z.string(),
});

export type AtaErrorResponse = z.infer<typeof ataErrorResponseSchema>;
