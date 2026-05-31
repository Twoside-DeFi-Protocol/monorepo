import { UseTokenAtaParams } from "@/types/api";
import { cacheTokenAta } from "../../lib/cache/ata";
import { ataResponseSchema } from "@/types/ata";

export async function fetchTokenAta({ tokenMint, owner, tokenProgramId }: UseTokenAtaParams) {
  const params: Record<string, string> = {
    tokenMint,
    owner,
  };
  if (tokenProgramId) {
    params.tokenProgramId = tokenProgramId;
  }
  const searchParams = new URLSearchParams(params);

  const response = await fetch(`/api/ata?${searchParams.toString()}`);
  const payload = await response.json();

  if (response.status == 200) {
    const parsedPayload = ataResponseSchema.safeParse(payload);
    if (!parsedPayload.success) {
      throw new Error("Invalid ATA response.");
    }

    cacheTokenAta(tokenMint, owner, parsedPayload.data.data, tokenProgramId);

    return parsedPayload.data.data;
  } else {
    throw new Error(payload.error);
  }
}
