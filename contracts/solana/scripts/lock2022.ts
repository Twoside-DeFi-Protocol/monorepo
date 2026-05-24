import * as anchor from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import {
  connection,
  program,
  programId,
  tokenMint2022,
  tokenDecimals,
  userAta2022,
  userDerivativeAta2022,
  developer,
  founder,
  TOKEN_METADATA_PROGRAM_ID,
} from "./setup";
import { user } from "../env";

(async function main() {
  try {
    const tokenProgramId = splToken.TOKEN_2022_PROGRAM_ID;

    console.log("==========================================");
    console.log("  LOCKING TOKEN-2022                      ");
    console.log("==========================================");
    console.log(`Current Mint: ${tokenMint2022.toBase58()}`);
    console.log(`Token Decimals: ${tokenDecimals}`);
    console.log(`Token Standard: TOKEN-2022`);
    console.log(`Token Program: ${tokenProgramId.toBase58()}`);

    // 1. Derive ATAs for developer and founder
    console.log("\n1. Deriving developer & founder ATAs...");
    const developerAta = splToken.getAssociatedTokenAddressSync(
      tokenMint2022,
      developer,
      false,
      tokenProgramId,
    );
    console.log(`Developer ATA: ${developerAta.toBase58()}`);

    const founderAta = splToken.getAssociatedTokenAddressSync(
      tokenMint2022,
      founder,
      false,
      tokenProgramId,
    );
    console.log(`Founder ATA: ${founderAta.toBase58()}`);

    // 2. Derive Program PDAs
    console.log("\n2. Deriving Program PDAs...");
    const [derivativeAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("derivative_authority"), tokenMint2022.toBuffer()],
      programId,
    );
    console.log(`Derivative Authority PDA: ${derivativeAuthority.toBase58()}`);

    const [derivativeMint] = PublicKey.findProgramAddressSync(
      [Buffer.from("derivative_mint"), tokenMint2022.toBuffer()],
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
      [Buffer.from("token_info"), tokenMint2022.toBuffer()],
      programId,
    );
    console.log(`Token Info PDA: ${tokenInfo.toBase58()}`);

    const [vaultAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_authority"), tokenMint2022.toBuffer()],
      programId,
    );
    console.log(`Vault Authority PDA: ${vaultAuthority.toBase58()}`);

    const vaultAta = splToken.getAssociatedTokenAddressSync(
      tokenMint2022,
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

    // Prepare accounts
    const accounts = {
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: tokenProgramId,
      associatedTokenProgram: splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
      mplTokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      tokenMint: tokenMint2022,
      tokenMetadata: null, // Send null as this file assumes the token uses standard Token-2022 extensions
      derivativeAuthority: derivativeAuthority,
      derivativeMint: derivativeMint,
      derivativeMetadata: derivativeMetadata,
      signer: user.publicKey,
      signerTokenAta: userAta2022,
      signerDerivativeAta: userDerivativeAta2022,
      tokenInfo: tokenInfo,
      vaultAuthority: vaultAuthority,
      vaultAta: vaultAta,
      globalInfo: globalInfo,
      founderAta: founderAta,
      developerAta: developerAta,
    };

    console.log("\nSending Lock Transaction...");
    const sig = await program.methods
      .lock(new anchor.BN(lockAmount))
      .accounts(accounts)
      .signers([user])
      .rpc();

    // ✅ Tokens Locked successfully
    console.log(`\n✅ Tokens Locked successfully.`);
    console.log(`Transaction Signature: ${sig}`);
    console.log("==========================================");
  } catch (e: any) {
    // ❌ Fatal error occurred
    console.error("❌ Fatal error during lock2022:", e);
    process.exit(1);
  }
})();
