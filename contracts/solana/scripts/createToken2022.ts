import {
  ExtensionType,
  createInitializeMintInstruction,
  createInitializeMetadataPointerInstruction,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
  LENGTH_SIZE,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";
import {
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
  Keypair,
} from "@solana/web3.js";
import { connection, developer, founder, saveState, programId } from "./setup";
import { user } from "../env";

(async function main() {
  try {
    console.log("==========================================");
    console.log("  CREATING TOKEN-2022 WITH METADATA       ");
    console.log("==========================================");
    console.log(`Payer/Mint Authority: ${user.publicKey.toBase58()}`);
    console.log(`Developer: ${developer.toBase58()}`);
    console.log(`Founder: ${founder.toBase58()}`);

    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;
    console.log(`Generated Mint Address: ${mint.toBase58()}`);

    // 1. Define Metadata
    const metadata = {
      mint: mint,
      name: "Token 2022",
      symbol: "T22",
      uri: "https://raw.githubusercontent.com/solana-developers/solana-web3-demo/main/metadata.json",
      additionalMetadata: [],
    };

    // 2. Calculate Space and Rent
    console.log("\n1. Calculating Space and Rent for Token-2022 Mint...");
    const extensions = [ExtensionType.MetadataPointer];
    const mintLen = getMintLen(extensions);
    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
    const lamports = await connection.getMinimumBalanceForRentExemption(
      mintLen + metadataLen,
    );

    // 3. Build and send transaction to initialize Mint with Extensions
    console.log(
      "2. Sending Transaction to Create and Initialize Mint Account...",
    );
    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: user.publicKey,
        newAccountPubkey: mint,
        space: mintLen + metadataLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeMetadataPointerInstruction(
        mint,
        user.publicKey,
        mint,
        TOKEN_2022_PROGRAM_ID,
      ),
      createInitializeMintInstruction(
        mint,
        9, // decimals
        user.publicKey,
        user.publicKey, // freeze authority
        TOKEN_2022_PROGRAM_ID,
      ),
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint: mint,
        metadata: mint,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        mintAuthority: user.publicKey,
        updateAuthority: user.publicKey,
      }),
    );

    const sig = await sendAndConfirmTransaction(
      connection,
      transaction,
      [user, mintKeypair],
      { commitment: "confirmed" },
    );
    // ✅ Token-2022 Mint Created
    console.log(`✅ Token-2022 Mint Created. Signature: ${sig}`);

    // 4. Create ATAs for user, developer & founder
    console.log("\n3. Creating Associated Token Accounts...");
    const userAta = await getOrCreateAssociatedTokenAccount(
      connection,
      user,
      mint,
      user.publicKey,
      undefined,
      "confirmed",
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
    // ✅ User ATA Created
    console.log(`✅ User ATA: ${userAta.address.toBase58()}`);

    const developerAta = await getOrCreateAssociatedTokenAccount(
      connection,
      user,
      mint,
      developer,
      undefined,
      "confirmed",
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
    // ✅ Developer ATA Created
    console.log(`✅ Developer ATA: ${developerAta.address.toBase58()}`);

    const founderAta = await getOrCreateAssociatedTokenAccount(
      connection,
      user,
      mint,
      founder,
      undefined,
      "confirmed",
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
    // ✅ Founder ATA Created
    console.log(`✅ Founder ATA: ${founderAta.address.toBase58()}`);

    // 5. Mint 100 tokens to user
    console.log("\n4. Minting 100 tokens to User...");
    const mintAmount = 100 * 10 ** 9;
    const mintSig = await mintTo(
      connection,
      user,
      mint,
      userAta.address,
      user,
      mintAmount,
      [],
      { commitment: "confirmed" },
      TOKEN_2022_PROGRAM_ID,
    );
    // ✅ Minted 100 tokens
    console.log(`✅ Minted 100 tokens. Transaction Signature: ${mintSig}`);

    // 6. Derive derivative mint PDA
    const [derivativeMintPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("derivative_mint"), mint.toBuffer()],
      programId,
    );
    // ✅ Derived Derivative Mint PDA
    console.log(
      `✅ Derived Derivative Mint PDA: ${derivativeMintPDA.toBase58()}`,
    );

    // 7. Save new state to state.json
    console.log("\n5. Saving updated state to state.json...");
    saveState({
      tokenMint2022: mint.toBase58(),
      derivativeMint2022: derivativeMintPDA.toBase58(),
      tokenDecimals: 9,
    });

    console.log("\n==========================================");
    console.log("  ✅ TOKEN-2022 CREATION SUCCESSFUL       ");
    console.log("==========================================");
  } catch (e: any) {
    // ❌ Fatal error occurred
    console.error("❌ Fatal error during createToken2022:", e);
    process.exit(1);
  }
})();
