import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { getTokenATA } from "@/features/dashboard/lib/sol/utils";
import {
  ataRequestSchema,
  ataResponseSchema,
  type AtaErrorResponse,
  type AtaResponse,
} from "@/types/ata";
import { getAtaCacheKey } from "@/features/dashboard/lib/cache/keys";
import { redis } from "@/lib/redis";
import { getSolanaRpcUrl, jsonError, sleep } from "@/lib/utils";

async function getCachedData(cacheKey: string): Promise<AtaResponse | null> {
  try {
    const cached = await redis.get(cacheKey);
    const parsed = ataResponseSchema.safeParse(cached);
    if (parsed.success) return parsed.data;
  } catch {}
  return null;
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

  const cached = await getCachedData(cacheKey);
  if (cached) return NextResponse.json<AtaResponse>(cached, { status: 200 });

  // 2. Try lock
  const lockKey = `lock:${cacheKey}`;
  const lock = await redis.set(lockKey, "1", {
    nx: true,
    ex: 10,
  });

  if (!lock) {
    // another request is fetching
    await sleep(100);
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return NextResponse.json<AtaResponse>(cached, { status: 200 });
    } else {
      return jsonError("Please retry shortly", 429);
    }
  }

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
    return jsonError("Failed to fetch ATA.", 500);
  } finally {
    if (lock) await redis.del(lockKey);
  }
}
