import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { getTokenATA } from "@/features/dashboard/lib/sol/utils";
import {
  ataRequestSchema,
  ataResponseSchema,
  type AtaErrorResponse,
  type AtaResponse,
} from "@/features/dashboard/lib/ata";
import { getAtaCacheKey } from "@/features/dashboard/lib/cache/keys";
import { redis } from "@/lib/redis";

function getSolanaRpcUrl() {
  const rpcUrl =
    process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";

  if (!rpcUrl) {
    throw new Error("RPC URL not configured for solana.");
  }

  return rpcUrl;
}

function jsonError(message: string, status: number) {
  return NextResponse.json<AtaErrorResponse>(
    { error: message },
    {
      status,
    },
  );
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<AtaResponse | AtaErrorResponse>> {
  const parsedRequest = ataRequestSchema.safeParse({
    tokenMint: request.nextUrl.searchParams.get("tokenMint"),
    owner: request.nextUrl.searchParams.get("owner"),
  });

  if (!parsedRequest.success) {
    return jsonError("Invalid request parameters.", 400);
  }

  const { tokenMint, owner } = parsedRequest.data;

  const cacheKey = getAtaCacheKey(tokenMint, owner);

  try {
    const cached = await redis.get(cacheKey);
    const parsed = ataResponseSchema.safeParse(cached);
    if (parsed.success) {
      return NextResponse.json<AtaResponse>(parsed.data, { status: 200 });
    }
  } catch {}

  try {
    const mintPublicKey = new PublicKey(tokenMint);
    const ownerPublicKey = new PublicKey(owner);
    const ata = getTokenATA(mintPublicKey, ownerPublicKey);
    const connection = new Connection(getSolanaRpcUrl(), "confirmed");
    const ataAccount = await connection.getAccountInfo(ata);

    const response: AtaResponse = {
      data: {
        ata: ata.toBase58(),
        exists: !!ataAccount,
      },
    };

    await redis.set(cacheKey, response, {
      ex: 3600,
    });

    return NextResponse.json<AtaResponse>(response, {
      status: 200,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch ATA.";

    return jsonError(message, 500);
  }
}
