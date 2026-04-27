import { z } from "zod";

export const ataRequestSchema = z.object({
  tokenMint: z.string().trim().min(1),
  owner: z.string().trim().min(1),
});

export type AtaRequest = z.infer<typeof ataRequestSchema>;

export const ataResponseSchema = z.object({
  ata: z.string(),
  exists: z.boolean(),
});

export type AtaResponse = z.infer<typeof ataResponseSchema>;

export type AtaErrorResponse = {
  error: string;
};
