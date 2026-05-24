import * as splToken from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  connection,
  tokenMint,
  tokenMint2022,
  tokenMint2022Metaplex,
  derivativeMint,
  derivativeMint2022,
  derivativeMint2022Metaplex,
  userAta,
  userDerivativeAta,
  userAta2022,
  userDerivativeAta2022,
  userAta2022Metaplex,
  userDerivativeAta2022Metaplex,
  developer,
  founder,
} from "./setup";
import { user } from "../env";

async function safeGetBalance(
  connection: Connection,
  ata: PublicKey,
): Promise<string> {
  try {
    const balanceInfo = await connection.getTokenAccountBalance(ata);
    // ✅ Balance retrieved successfully
    return `${balanceInfo.value.uiAmountString ?? "0"} ✅`;
  } catch (error) {
    // ❌ Account doesn't exist or is not initialized yet
    return "0 ⚠️ (uninitialized/empty)";
  }
}

(async function main() {
  try {
    console.log("==========================================");
    console.log("  PRINTING TOKEN DATA                     ");
    console.log("==========================================");

    console.log("\n--- 1. STANDARD SPL TOKEN ---");
    console.log(`Original Mint: ${tokenMint.toBase58()}`);
    console.log(`Derivative Mint: ${derivativeMint.toBase58()}`);
    const devAtaStandard = splToken.getAssociatedTokenAddressSync(
      tokenMint,
      developer,
      false,
      splToken.TOKEN_PROGRAM_ID,
    );
    const founderAtaStandard = splToken.getAssociatedTokenAddressSync(
      tokenMint,
      founder,
      false,
      splToken.TOKEN_PROGRAM_ID,
    );
    console.log(`User original ATA: ${userAta.toBase58()}`);
    console.log(
      `User original balance: ${await safeGetBalance(connection, userAta)}`,
    );
    console.log(`User derivative ATA: ${userDerivativeAta.toBase58()}`);
    console.log(
      `User derivative balance: ${await safeGetBalance(connection, userDerivativeAta)}`,
    );
    console.log(`Developer ATA: ${devAtaStandard.toBase58()}`);
    console.log(
      `Developer balance: ${await safeGetBalance(connection, devAtaStandard)}`,
    );
    console.log(`Founder ATA: ${founderAtaStandard.toBase58()}`);
    console.log(
      `Founder balance: ${await safeGetBalance(connection, founderAtaStandard)}`,
    );

    console.log("\n--- 2. TOKEN-2022 (EXTENSION METADATA) ---");
    console.log(`Original Mint: ${tokenMint2022.toBase58()}`);
    console.log(`Derivative Mint: ${derivativeMint2022.toBase58()}`);
    const devAta2022 = splToken.getAssociatedTokenAddressSync(
      tokenMint2022,
      developer,
      false,
      splToken.TOKEN_2022_PROGRAM_ID,
    );
    const founderAta2022 = splToken.getAssociatedTokenAddressSync(
      tokenMint2022,
      founder,
      false,
      splToken.TOKEN_2022_PROGRAM_ID,
    );
    console.log(`User original ATA: ${userAta2022.toBase58()}`);
    console.log(
      `User original balance: ${await safeGetBalance(connection, userAta2022)}`,
    );
    console.log(`User derivative ATA: ${userDerivativeAta2022.toBase58()}`);
    console.log(
      `User derivative balance: ${await safeGetBalance(connection, userDerivativeAta2022)}`,
    );
    console.log(`Developer ATA: ${devAta2022.toBase58()}`);
    console.log(
      `Developer balance: ${await safeGetBalance(connection, devAta2022)}`,
    );
    console.log(`Founder ATA: ${founderAta2022.toBase58()}`);
    console.log(
      `Founder balance: ${await safeGetBalance(connection, founderAta2022)}`,
    );

    console.log("\n--- 3. TOKEN-2022 (METAPLEX METADATA) ---");
    console.log(`Original Mint: ${tokenMint2022Metaplex.toBase58()}`);
    console.log(`Derivative Mint: ${derivativeMint2022Metaplex.toBase58()}`);
    const devAta2022Metaplex = splToken.getAssociatedTokenAddressSync(
      tokenMint2022Metaplex,
      developer,
      false,
      splToken.TOKEN_2022_PROGRAM_ID,
    );
    const founderAta2022Metaplex = splToken.getAssociatedTokenAddressSync(
      tokenMint2022Metaplex,
      founder,
      false,
      splToken.TOKEN_2022_PROGRAM_ID,
    );
    console.log(`User original ATA: ${userAta2022Metaplex.toBase58()}`);
    console.log(
      `User original balance: ${await safeGetBalance(connection, userAta2022Metaplex)}`,
    );
    console.log(
      `User derivative ATA: ${userDerivativeAta2022Metaplex.toBase58()}`,
    );
    console.log(
      `User derivative balance: ${await safeGetBalance(connection, userDerivativeAta2022Metaplex)}`,
    );
    console.log(`Developer ATA: ${devAta2022Metaplex.toBase58()}`);
    console.log(
      `Developer balance: ${await safeGetBalance(connection, devAta2022Metaplex)}`,
    );
    console.log(`Founder ATA: ${founderAta2022Metaplex.toBase58()}`);
    console.log(
      `Founder balance: ${await safeGetBalance(connection, founderAta2022Metaplex)}`,
    );
    console.log("==========================================");
  } catch (e: any) {
    // ❌ Fatal error occurred
    console.error("❌ Fatal error during printTokenData:", e);
    process.exit(1);
  }
})();
