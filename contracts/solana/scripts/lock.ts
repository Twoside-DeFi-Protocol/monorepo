import * as anchor from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
  connection,
  program,
  programId,
  tokenMint,
  tokenDecimals,
  userAta,
  userDerivativeAta,
  developer,
  founder,
  TOKEN_METADATA_PROGRAM_ID,
} from "./setup";
import { user } from "../env";

(async function main() {
  try {
    const tokenProgramId = splToken.TOKEN_PROGRAM_ID;

    console.log("==========================================");
    console.log("  LOCKING TOKENS                          ");
    console.log("==========================================");
    console.log(`Current Mint: ${tokenMint.toBase58()}`);
    console.log(`Token Decimals: ${tokenDecimals}`);
    console.log(`Token Standard: STANDARD`);
    console.log(`Token Program: ${tokenProgramId.toBase58()}`);

    // 1. Derive ATAs for developer and founder
    console.log("\n1. Deriving developer & founder ATAs...");
    const developerAta = splToken.getAssociatedTokenAddressSync(
      tokenMint,
      developer,
      false,
      tokenProgramId,
    );
    console.log(`Developer ATA: ${developerAta.toBase58()}`);

    const founderAta = splToken.getAssociatedTokenAddressSync(
      tokenMint,
      founder,
      false,
      tokenProgramId,
    );
    console.log(`Founder ATA: ${founderAta.toBase58()}`);

    // 2. Derive Program PDAs
    console.log("\n2. Deriving Program PDAs...");
    const [tokenMetadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        tokenMint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    );

    const [derivativeAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("derivative_authority"), tokenMint.toBuffer()],
      programId,
    );
    console.log(`Derivative Authority PDA: ${derivativeAuthority.toBase58()}`);

    const [derivativeMint] = PublicKey.findProgramAddressSync(
      [Buffer.from("derivative_mint"), tokenMint.toBuffer()],
      programId,
    );
    console.log(`Derivative Mint PDA: ${derivativeMint.toBase58()}`);

    const [derivativeMetadata] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        derivativeMint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    );
    console.log(`Derivative Metadata PDA: ${derivativeMetadata.toBase58()}`);

    const [tokenInfo] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_info"), tokenMint.toBuffer()],
      programId,
    );
    console.log(`Token Info PDA: ${tokenInfo.toBase58()}`);

    const [vaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_authority"), tokenMint.toBuffer()],
      programId,
    );
    console.log(`Vault Authority PDA: ${vaultAuthority.toBase58()}`);

    const vaultAta = splToken.getAssociatedTokenAddressSync(
      tokenMint,
      vaultAuthority,
      true,
      tokenProgramId,
    );
    console.log(`Vault ATA: ${vaultAta.toBase58()}`);

    const [globalInfo] = PublicKey.findProgramAddressSync(
      [Buffer.from("global_info")],
      programId,
    );

    // 3. Lock 10 tokens
    const lockAmount = 10 * 10 ** tokenDecimals;
    console.log(`\nLock Amount: 10 (${lockAmount} raw)`);

    console.log("\nSending Lock Transaction...");
    const sig = await program.methods
      .lock(new anchor.BN(lockAmount))
      .accounts({
        mplTokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        tokenMint: tokenMint,
        tokenMetadata: tokenMetadataPDA,
        signer: user.publicKey,
        signerTokenAta: userAta,
        founderAta: founderAta,
        developerAta: developerAta,
      })
      .signers([user])
      .rpc();

    // ✅ Tokens Locked successfully
    console.log(`\n✅ Tokens Locked successfully.`);
    console.log(`Transaction Signature: ${sig}`);
    console.log("==========================================");
  } catch (e: any) {
    // ❌ Fatal error occurred
    console.error("❌ Fatal error during lock:", e);
    process.exit(1);
  }
})();
