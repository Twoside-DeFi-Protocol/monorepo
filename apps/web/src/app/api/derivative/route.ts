import { NextRequest, NextResponse } from "next/server";
import { PublicKey, Connection } from "@solana/web3.js";
import { ethers } from "ethers";
import { Program, type Provider } from "@coral-xyz/anchor";
import { envVariables } from "@/lib/envVariables";
import {
  derivativeRequestSchema,
  type DerivativeErrorResponse,
  type DerivativeResponse,
} from "@/features/dashboard/lib/derivative";
import { getTokenDerivativePDA } from "@/features/dashboard/lib/sol/utils";
import idl from "@/features/dashboard/lib/sol/idl.json";
import type { Twoside } from "@/features/dashboard/lib/sol/idlType";

const EVM_ABI = [
  "function tokenDerivatives(address token) view returns (address)",
] as const;

function jsonError(message: string, status: number) {
  return NextResponse.json<DerivativeErrorResponse>(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function getEvmRpcUrl(chain: "eth" | "base") {
  const rpcUrl =
    chain === "eth" ? process.env.ETH_RPC_URL : process.env.BASE_RPC_URL;

  if (!rpcUrl) {
    throw new Error(`RPC URL not configured for ${chain}.`);
  }

  return rpcUrl;
}

function getSolanaRpcUrl() {
  const rpcUrl =
    process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";

  if (!rpcUrl) {
    throw new Error("RPC URL not configured for solana.");
  }

  return rpcUrl;
}

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
  const contract = new ethers.Contract(twosideContract, EVM_ABI, provider);
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

  try {
    const derivative =
      chain === "solana"
        ? await getSolanaDerivative(tokenAddressOrMint)
        : await getEvmDerivative(chain, tokenAddressOrMint);

    return NextResponse.json<DerivativeResponse>(
      { derivative },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch derivative.";

    return jsonError(message, 500);
  }
}
