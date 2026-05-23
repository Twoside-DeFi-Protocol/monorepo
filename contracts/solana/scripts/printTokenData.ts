import * as splToken from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  connection,
  tokenMint,
  derivativeMint,
  tokenStandard,
  tokenProgramId,
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
    console.log(`Original Mint: ${tokenMint.toBase58()}`);
    console.log(`Derivative Mint: ${derivativeMint.toBase58()}`);
    console.log(`Token Standard: ${tokenStandard.toUpperCase()}`);
    console.log(`Token Program ID: ${tokenProgramId.toBase58()}`);

    // Derive Original ATAs
    const userOrigAta = splToken.getAssociatedTokenAddressSync(
      tokenMint,
      user.publicKey,
      false,
      tokenProgramId,
    );
    const developerOrigAta = splToken.getAssociatedTokenAddressSync(
      tokenMint,
      developer,
      false,
      tokenProgramId,
    );
    const founderOrigAta = splToken.getAssociatedTokenAddressSync(
      tokenMint,
      founder,
      false,
      tokenProgramId,
    );

    // Derive Derivative ATAs
    const userDerivAta = splToken.getAssociatedTokenAddressSync(
      derivativeMint,
      user.publicKey,
      false,
      tokenProgramId,
    );
    const developerDerivAta = splToken.getAssociatedTokenAddressSync(
      derivativeMint,
      developer,
      false,
      tokenProgramId,
    );
    const founderDerivAta = splToken.getAssociatedTokenAddressSync(
      derivativeMint,
      founder,
      false,
      tokenProgramId,
    );

    console.log("\n--- ORIGINAL TOKENS ---");
    console.log(`User original ATA: ${userOrigAta.toBase58()}`);
    console.log(
      `User original balance: ${await safeGetBalance(connection, userOrigAta)}`,
    );

    console.log(`Developer original ATA: ${developerOrigAta.toBase58()}`);
    console.log(
      `Developer original balance: ${await safeGetBalance(connection, developerOrigAta)}`,
    );

    console.log(`Founder original ATA: ${founderOrigAta.toBase58()}`);
    console.log(
      `Founder original balance: ${await safeGetBalance(connection, founderOrigAta)}`,
    );

    console.log("\n--- DERIVATIVE TOKENS ---");
    console.log(`User derivative ATA: ${userDerivAta.toBase58()}`);
    console.log(
      `User derivative balance: ${await safeGetBalance(connection, userDerivAta)}`,
    );

    console.log(`Developer derivative ATA: ${developerDerivAta.toBase58()}`);
    console.log(
      `Developer derivative balance: ${await safeGetBalance(connection, developerDerivAta)}`,
    );

    console.log(`Founder derivative ATA: ${founderDerivAta.toBase58()}`);
    console.log(
      `Founder derivative balance: ${await safeGetBalance(connection, founderDerivAta)}`,
    );
    console.log("==========================================");
  } catch (e: any) {
    // ❌ Fatal error occurred
    console.error("❌ Fatal error during printTokenData:", e);
    process.exit(1);
  }
})();
