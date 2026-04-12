import * as anchor from "@coral-xyz/anchor";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import * as splToken from "@solana/spl-token";
import {
  tokenDecimals,
  tokenMetaplexAccount,
  tokenMint,
  user,
  program,
  userAta,
  developer,
  founder,
} from "./setup";
import { PublicKey } from "@solana/web3.js";

(async function main() {
  try {
    const developerAta = splToken.getAssociatedTokenAddressSync(
      tokenMint,
      developer.publicKey,
    );
    const founderAta = splToken.getAssociatedTokenAddressSync(
      tokenMint,
      founder,
    );

    const [tokenMetadataPDA, tokenMetadataBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
          tokenMint.toBuffer(),
        ],
        new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID),
      );

    console.log("Locking Tokens :-");
    const lockAmount = 10 * 10 ** tokenDecimals;
    const sig = await program.methods
      .lock(new anchor.BN(lockAmount))
      .accounts({
        tokenMint: tokenMint,
        tokenMetadata: tokenMetadataPDA,
        signer: user.publicKey,
        signerTokenAta: userAta,
        developerAta: developerAta,
        founderAta: founderAta,
        mplTokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
      })
      .signers([user])
      .rpc();
    console.log("Sig: ", sig);
    console.log("");
  } catch (e: any) {
    console.error("Fatal error:", e);
    process.exit(1);
  }
})();
