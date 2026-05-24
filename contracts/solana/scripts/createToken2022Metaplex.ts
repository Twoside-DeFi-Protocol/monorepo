import * as splToken from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  Collection,
  createMetadataAccountV3,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionDataArgs,
  Creator,
  Uses,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  none,
  signerIdentity,
} from "@metaplex-foundation/umi";
import {
  fromWeb3JsKeypair,
  fromWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";
import { connection, developer, founder, saveState, programId } from "./setup";
import { user } from "../env";

(async function main() {
  try {
    console.log("==========================================");
    console.log("  CREATING TOKEN-2022 WITH METAPLEX       ");
    console.log("==========================================");
    console.log(`Payer/Mint Authority: ${user.publicKey.toBase58()}`);
    console.log(`Developer: ${developer.toBase58()}`);
    console.log(`Founder: ${founder.toBase58()}`);

    // 1. Create a token mint with Token-2022
    console.log("\n1. Creating Mint Account (Token-2022)...");
    const mint = await splToken.createMint(
      connection,
      user, // payer
      user.publicKey, // mint authority
      user.publicKey, // freeze authority
      9, // decimals
      undefined,
      { commitment: "confirmed" },
      splToken.TOKEN_2022_PROGRAM_ID,
    );
    // ✅ Token-2022 Mint Created
    console.log(`✅ Token-2022 Mint Created: ${mint.toBase58()}`);

    // 2. Create ATAs for user, developer & founder using Token-2022
    console.log("\n2. Creating Associated Token Accounts...");
    const userAta = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      user,
      mint,
      user.publicKey,
      undefined,
      "confirmed",
      undefined,
      splToken.TOKEN_2022_PROGRAM_ID,
    );
    // ✅ User ATA Created
    console.log(`✅ User ATA: ${userAta.address.toBase58()}`);

    const developerAta = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      user,
      mint,
      developer,
      undefined,
      "confirmed",
      undefined,
      splToken.TOKEN_2022_PROGRAM_ID,
    );
    // ✅ Developer ATA Created
    console.log(`✅ Developer ATA: ${developerAta.address.toBase58()}`);

    const founderAta = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      user,
      mint,
      founder,
      undefined,
      "confirmed",
      undefined,
      splToken.TOKEN_2022_PROGRAM_ID,
    );
    // ✅ Founder ATA Created
    console.log(`✅ Founder ATA: ${founderAta.address.toBase58()}`);

    // 3. Create Metaplex Metadata for Token-2022
    console.log("\n3. Creating Metaplex Metadata Account...");
    const umi = createUmi(connection.rpcEndpoint);
    const umiSigner = createSignerFromKeypair(umi, fromWeb3JsKeypair(user));
    umi.use(signerIdentity(umiSigner, true));

    const onChainData = {
      name: "Token 2022 Metaplex",
      symbol: "T22M",
      uri: "https://raw.githubusercontent.com/solana-developers/solana-web3-demo/main/metadata.json",
      sellerFeeBasisPoints: 0,
      creators: none<Creator[]>(),
      collection: none<Collection>(),
      uses: none<Uses>(),
    };
    const accounts: CreateMetadataAccountV3InstructionAccounts = {
      mint: fromWeb3JsPublicKey(mint),
      mintAuthority: umiSigner,
    };
    const data: CreateMetadataAccountV3InstructionDataArgs = {
      isMutable: true,
      collectionDetails: null,
      data: onChainData,
    };
    const res = await createMetadataAccountV3(umi, {
      ...accounts,
      ...data,
    }).sendAndConfirm(umi);
    // ✅ Metaplex Metadata Account Created
    console.log("✅ Metaplex Metadata Account Created.");

    // 4. Mint 100 tokens to user
    console.log("\n4. Minting 100 tokens to User...");
    const mintAmount = 100 * 10 ** 9;
    const mintSig = await splToken.mintTo(
      connection,
      user,
      mint,
      userAta.address,
      user,
      mintAmount,
      [],
      { commitment: "confirmed" },
      splToken.TOKEN_2022_PROGRAM_ID,
    );
    // ✅ Minted 100 tokens
    console.log(`✅ Minted 100 tokens. Transaction Signature: ${mintSig}`);

    // 5. Derive derivative mint PDA
    const [derivativeMintPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("derivative_mint"), mint.toBuffer()],
      programId,
    );
    // ✅ Derived Derivative Mint PDA
    console.log(
      `✅ Derived Derivative Mint PDA: ${derivativeMintPDA.toBase58()}`,
    );

    // 6. Save new state to state.json
    console.log("\n5. Saving updated state to state.json...");
    saveState({
      tokenMint2022Metaplex: mint.toBase58(),
      derivativeMint2022Metaplex: derivativeMintPDA.toBase58(),
      tokenDecimals: 9,
    });

    console.log("\n==========================================");
    console.log("  ✅ TOKEN CREATION SUCCESSFUL            ");
    console.log("==========================================");
  } catch (e: any) {
    // ❌ Fatal error occurred
    console.error("❌ Fatal error during createToken2022Metaplex:", e);
    process.exit(1);
  }
})();
