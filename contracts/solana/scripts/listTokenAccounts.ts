// scripts/listTokenAccounts.ts
import { PublicKey, ParsedAccountData } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getTokenMetadata,
} from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  mplTokenMetadata,
  fetchDigitalAssetWithToken,
} from "@metaplex-foundation/mpl-token-metadata";
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";

import { connection } from "./setup";
import { user } from "../env";

type TokenAccountInfo = {
  mint: string;
  owner: string;
  tokenAmount: {
    amount: string;
    decimals: number;
    uiAmount: number | null;
    uiAmountString: string | null;
  };
};

type Row = {
  tokenProgram: string;
  tokenAccount: string;
  mint: string;
  name: string;
  symbol: string;
  balance: string;
  decimals: number;
};

function safeTrim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function main() {
  const walletArg = process.argv[2];
  const owner = new PublicKey(walletArg ?? user.publicKey.toBase58());

  const umi = createUmi(connection.rpcEndpoint).use(mplTokenMetadata());

  const [legacyAccounts, token2022Accounts] = await Promise.all([
    connection.getParsedTokenAccountsByOwner(owner, {
      programId: TOKEN_PROGRAM_ID,
    }),
    connection.getParsedTokenAccountsByOwner(owner, {
      programId: TOKEN_2022_PROGRAM_ID,
    }),
  ]);

  const allAccounts = [
    ...legacyAccounts.value.map((x) => ({
      ...x,
      tokenProgram: "SPL-Token",
      programId: TOKEN_PROGRAM_ID,
    })),
    ...token2022Accounts.value.map((x) => ({
      ...x,
      tokenProgram: "Token-2022",
      programId: TOKEN_2022_PROGRAM_ID,
    })),
  ];

  if (allAccounts.length === 0) {
    console.log(`No token accounts found for ${owner.toBase58()}`);
    return;
  }

  const rows: Row[] = [];

  for (const acc of allAccounts) {
    const parsed = acc.account.data as ParsedAccountData;
    const info = parsed.parsed.info as TokenAccountInfo;

    const mintPk = new PublicKey(info.mint);

    let name = "Unknown";
    let symbol = "Unknown";

    // 1) Try Token-2022 native mint metadata first.
    if (acc.programId.equals(TOKEN_2022_PROGRAM_ID)) {
      try {
        const tokenMetadata = await getTokenMetadata(
          connection,
          mintPk,
          "confirmed",
          TOKEN_2022_PROGRAM_ID,
        );

        if (tokenMetadata) {
          name = safeTrim(tokenMetadata.name) || name;
          symbol = safeTrim(tokenMetadata.symbol) || symbol;
        }
      } catch {
        // No in-mint TokenMetadata extension, or fetch failed.
      }
    }

    // 2) Fallback to Metaplex metadata PDA.
    if (name === "Unknown") {
      try {
        const asset = await fetchDigitalAssetWithToken(
          umi,
          fromWeb3JsPublicKey(mintPk),
          fromWeb3JsPublicKey(acc.pubkey),
        );

        name = safeTrim(asset.metadata?.name) || name;
        symbol = safeTrim(asset.metadata?.symbol) || symbol;
      } catch {
        // No Metaplex metadata account, or fetch failed.
      }
    }

    rows.push({
      tokenProgram: acc.tokenProgram,
      tokenAccount: acc.pubkey.toBase58(),
      mint: mintPk.toBase58(),
      name,
      symbol,
      balance: info.tokenAmount.uiAmountString ?? "0",
      decimals: info.tokenAmount.decimals,
    });
  }

  console.table(rows);
}

main().catch((e) => {
  console.error("Failed to list token accounts:", e);
  process.exit(1);
});
