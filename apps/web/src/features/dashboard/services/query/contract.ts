import { UseTokenDerivativeParams } from "@/types/api";
import { derivativeResponseSchema } from "@/types/derivative";
import { cacheTokenDerivative } from "../../lib/cache/derivative";

export async function fetchTokenDerivative({
  chain,
  tokenAddressOrMint,
}: UseTokenDerivativeParams) {
  const params = new URLSearchParams({
    chain: chain.id,
    tokenAddressOrMint,
  });

  const response = await fetch(`/api/derivative?${params.toString()}`);
  const payload = await response.json();

  if (response.status == 200) {
    const parsedPayload = derivativeResponseSchema.safeParse(payload);
    if (!parsedPayload.success) {
      throw new Error("Invalid derivative response.");
    }

    cacheTokenDerivative(chain.id, tokenAddressOrMint, parsedPayload.data.data);

    return parsedPayload.data.data;
  } else {
    throw new Error(payload.error);
  }
}
