import * as anchor from "@coral-xyz/anchor";
import { tokenMint, programId, developer, founder } from "./setup";
import * as splToken from "@solana/spl-token";
import { user } from "../env";

const DERIVATIVE_MINT_STATIC_SEED: Buffer<ArrayBuffer> =
  Buffer.from("derivative_mint");

(async function main() {
  try {
    const [derivativeMintPDA, derivativeMintBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [DERIVATIVE_MINT_STATIC_SEED, tokenMint.toBuffer()],
        programId,
      );

    console.log("Derivative Mint: ", derivativeMintPDA);
    console.log("");

    const userAta = await splToken.getAssociatedTokenAddressSync(
      derivativeMintPDA,
      user.publicKey,
    );
    console.log("User Derivative ATA: ", userAta.toString());
    console.log("");

    const developerAta = await splToken.getAssociatedTokenAddressSync(
      derivativeMintPDA,
      developer.publicKey,
    );
    console.log("Developer Derivative ATA: ", developerAta.toString());
    console.log("");

    const founderAta = await splToken.getAssociatedTokenAddressSync(
      derivativeMintPDA,
      founder,
    );
    console.log("Founder Derivative ATA: ", founderAta.toString());
    console.log("");
  } catch (e: any) {
    console.error("Fatal error:", e);
    process.exit(1);
  }
})();
