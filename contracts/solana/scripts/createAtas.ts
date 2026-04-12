import * as splToken from "@solana/spl-token";
import { connection, developer, founder, tokenMint, user } from "./setup";

(async function main() {
  try {
    // USER ATA
    const userAta = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      user, // payer
      tokenMint,
      user.publicKey,
    );
    console.log("User ATA: ", userAta.address);

    // DEVELOPER ATA
    const developerAta = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      user, // payer
      tokenMint,
      developer.publicKey,
    );
    console.log("Developer ATA: ", developerAta.address);

    // FOUNDER ATA
    const founderAta = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      user, // payer
      tokenMint,
      founder,
    );
    console.log("Founder ATA: ", founderAta.address);

    console.log("");

    // ✅ MINT TOKENS (user is mint authority)
    const mintAmount = 1000 * 10 ** 9; // adjust decimals if needed

    // Mint to USER
    await splToken.mintTo(
      connection,
      user, // payer
      tokenMint,
      userAta.address,
      user, // mint authority
      mintAmount,
    );
    console.log("Minted to User");
  } catch (e: any) {
    console.error("Fatal error:", e);
    process.exit(1);
  }
})();
