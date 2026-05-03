import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { getTokenATA } from "@/features/dashboard/lib/sol/utils";
import {
  ataRequestSchema,
  type AtaErrorResponse,
  type AtaResponse,
} from "@/features/dashboard/lib/ata";

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
      headers: {
        "Cache-Control": "no-store",
      },
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

  try {
    const mintPublicKey = new PublicKey(tokenMint);
    const ownerPublicKey = new PublicKey(owner);
    const ata = getTokenATA(mintPublicKey, ownerPublicKey);
    const connection = new Connection(getSolanaRpcUrl(), "confirmed");
    const ataAccount = await connection.getAccountInfo(ata);

    return NextResponse.json<AtaResponse>(
      {
        data: {
          ata: ata.toBase58(),
          exists: !!ataAccount,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch ATA.";

    return jsonError(message, 500);
  }
}
