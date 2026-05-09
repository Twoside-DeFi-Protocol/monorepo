import { NextRequest, NextResponse } from "next/server";
import { PublicKey, Connection } from "@solana/web3.js";
import { ethers } from "ethers";
import { Program, type Provider } from "@coral-xyz/anchor";
import { envVariables } from "@/lib/envVariables";
import {
  derivativeRequestSchema,
  derivativeResponseSchema,
  type DerivativeErrorResponse,
  type DerivativeResponse,
} from "@/types/derivative";
import { getTokenDerivativePDA } from "@/features/dashboard/lib/sol/utils";
import idl from "@/features/dashboard/lib/sol/idl.json";
import type { Twoside } from "@/features/dashboard/lib/sol/idlType";
import { getDerivativeCacheKey } from "@/features/dashboard/lib/cache/keys";
import { redis } from "@/lib/redis";
import { getEvmRpcUrl, getSolanaRpcUrl, jsonError, sleep } from "@/lib/utils";
import {
  ETH_ADDRESS_NULL_VALUE,
  SOL_ADDRESS_NULL_VALUE,
} from "@/lib/constants";
import twosideAbi from "../../../features/dashboard/lib/evm/twoside.json";

async function getEvmDerivative(
  chain: "eth" | "base",
  tokenAddressOrMint: string,
) {
  if (!ethers.isAddress(tokenAddressOrMint)) {
    throw new Error("Invalid EVM token address.");
  }

  const twosideContract =
    chain === "eth"
      ? envVariables.twosideContract.eth
      : envVariables.twosideContract.base;
  if (!twosideContract || !ethers.isAddress(twosideContract)) {
    throw new Error("Twoside contract address not set.");
  }

  const provider = new ethers.JsonRpcProvider(getEvmRpcUrl(chain));
  const contract = new ethers.Contract(
    twosideContract,
    twosideAbi.abi,
    provider,
  );
  const derivative = await contract.tokenDerivatives(tokenAddressOrMint);

  return String(derivative);
}

async function getSolanaDerivative(tokenAddressOrMint: string) {
  let tokenMint: PublicKey;

  try {
    tokenMint = new PublicKey(tokenAddressOrMint);
  } catch {
    throw new Error("Invalid Solana mint address.");
  }

  const connection = new Connection(getSolanaRpcUrl(), "confirmed");
  const provider = { connection } as Provider;
  const program = new Program(idl as Twoside, provider);
  const { pda } = getTokenDerivativePDA(tokenMint);

  try {
    const account = await (program.account as any).tokenInfo.fetch(pda);
    return account.derivativeMint.toString();
  } catch {
    return "";
  }
}

async function getCachedData(
  cacheKey: string,
): Promise<DerivativeResponse | null> {
  try {
    const cached = await redis.get(cacheKey);
    const parsed = derivativeResponseSchema.safeParse(cached);
    if (parsed.success) return parsed.data;
  } catch {}
  return null;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<DerivativeResponse | DerivativeErrorResponse>> {
  const parsedRequest = derivativeRequestSchema.safeParse({
    chain: request.nextUrl.searchParams.get("chain"),
    tokenAddressOrMint: request.nextUrl.searchParams.get("tokenAddressOrMint"),
  });

  if (!parsedRequest.success) {
    return jsonError("Invalid request parameters.", 400);
  }

  const { chain, tokenAddressOrMint } = parsedRequest.data;

  const cacheKey = getDerivativeCacheKey(chain, tokenAddressOrMint);

  const cached = await getCachedData(cacheKey);
  if (cached)
    return NextResponse.json<DerivativeResponse>(cached, { status: 200 });

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
      return NextResponse.json<DerivativeResponse>(cached, { status: 200 });
    } else {
      return jsonError("Please retry shortly", 429);
    }
  }

  try {
    const derivative =
      chain === "solana"
        ? await getSolanaDerivative(tokenAddressOrMint)
        : await getEvmDerivative(chain, tokenAddressOrMint);

    if (
      derivative == ETH_ADDRESS_NULL_VALUE ||
      derivative == SOL_ADDRESS_NULL_VALUE
    ) {
      return jsonError("Derivative not initialized yet.", 500);
    }

    const response: DerivativeResponse = {
      data: derivative,
    };

    await redis.set(cacheKey, response, {
      ex: 3600 + Math.floor(Math.random() * 60),
    });

    return NextResponse.json<DerivativeResponse>(response, {
      status: 200,
    });
  } catch (error) {
    return jsonError("Failed to fetch derivative.", 500);
  } finally {
    if (lock) await redis.del(lockKey);
  }
}
