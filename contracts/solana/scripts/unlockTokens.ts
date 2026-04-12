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
  userDerivativeAta,
  VAULT_AUTHORITY_STATIC_SEED,
  programId,
} from "./setup";
import { PublicKey } from "@solana/web3.js";

(async function main() {
  try {
    // const developerAta = splToken.getAssociatedTokenAddressSync(
    //   tokenMint,
    //   developer.publicKey,
    // );
    // const founderAta = splToken.getAssociatedTokenAddressSync(
    //   tokenMint,
    //   founder,
    // );

    const developerAta = splToken.getAssociatedTokenAddressSync(
      tokenMint,
      developer.publicKey,
    );
    const founderAta = splToken.getAssociatedTokenAddressSync(
      tokenMint,
      founder,
    );

    console.log("");
    console.log("8LFmzh6w5txgc12VBnLHFLXfexBRakhjXqGnHoTG28fk");
    console.log(developerAta);
    console.log("");
    console.log("GPrVL9JpnJjwUsTmBZEd7FUUPorQb9wwqVjoPUgGMfgQ");
    console.log(founderAta);
    console.log("");

    const [tokenMetadataPDA, tokenMetadataBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
          tokenMint.toBuffer(),
        ],
        new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID),
      );

    const [vaultAuthorityPDA, vaultAuthorityBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [VAULT_AUTHORITY_STATIC_SEED, tokenMint.toBuffer()],
        new PublicKey(programId),
      );

    const vaultAta = splToken.getAssociatedTokenAddressSync(
      tokenMint,
      vaultAuthorityPDA,
      true,
    );

    console.log("Unlocking Tokens :-");
    console.log("8JDdYEogjJ3G4Y9RV86LYjNksLysU2Av7aKVJiV9qRvm");
    console.log(user.publicKey);
    console.log(`user ata - ${userAta}`);
    const unlockAmount = 5 * 10 ** tokenDecimals;
    const sig = await program.methods
      .unlock(new anchor.BN(unlockAmount))
      .accounts({
        tokenMint: tokenMint,
        signer: user.publicKey,
        signerTokenAta: userAta,
        developerAta: developerAta,
        founderAta: founderAta,
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
