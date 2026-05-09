import { UseTokenAtaParams } from "@/types/api";
import { cacheTokenAta } from "../../lib/cache/ata";
import { ataResponseSchema } from "@/types/ata";

export async function fetchTokenAta({ tokenMint, owner }: UseTokenAtaParams) {
  const params = new URLSearchParams({
    tokenMint,
    owner,
  });

  const response = await fetch(`/api/ata?${params.toString()}`);
  const payload = await response.json();

  if (response.status == 200) {
    const parsedPayload = ataResponseSchema.safeParse(payload);
    if (!parsedPayload.success) {
      throw new Error("Invalid ATA response.");
    }

    cacheTokenAta(tokenMint, owner, parsedPayload.data.data);

    return parsedPayload.data.data;
  } else {
    throw new Error(payload.error);
  }
}
