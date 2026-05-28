import * as splToken from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SendTransactionError,
  SystemProgram,
} from "@solana/web3.js";
import {
  Collection,
  Creator,
  Uses,
  createMetadataAccountV3,
  findMetadataPda,
  mplTokenMetadata,
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
import {
  connection,
  developer,
  founder,
  saveState,
  programId,
  tokenMintIteration,
} from "./setup";
import { user } from "../env";

(async function main() {
  try {
    console.log("==========================================");
    console.log("  CREATING STANDARD SPL TOKEN MINT        ");
    console.log("==========================================");
    console.log(`Payer/Mint Authority: ${user.publicKey.toBase58()}`);
    console.log(`Developer: ${developer.toBase58()}`);
    console.log(`Founder: ${founder.toBase58()}`);

    console.log("\n1. Creating Mint Account...");
    const mint = await splToken.createMint(
      connection,
      user,
      user.publicKey,
      user.publicKey,
      9,
      undefined,
      { commitment: "finalized" },
    );

    // Make sure the mint is actually readable before metadata creation.
    await connection.getAccountInfo(mint, "finalized");
    console.log(`✅ Original Token Mint Created: ${mint.toBase58()}`);

    console.log("\n2. Creating Associated Token Accounts...");
    const userAta = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      user,
      mint,
      user.publicKey,
    );
    console.log(`✅ User ATA: ${userAta.address.toBase58()}`);

    const developerAta = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      user,
      mint,
      developer,
    );
    console.log(`✅ Developer ATA: ${developerAta.address.toBase58()}`);

    const founderAta = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      user,
      mint,
      founder,
    );
    console.log(`✅ Founder ATA: ${founderAta.address.toBase58()}`);

    console.log("\n3. Creating Metaplex Metadata Account...");
    const umi = createUmi(connection.rpcEndpoint).use(mplTokenMetadata());
    const umiSigner = createSignerFromKeypair(umi, fromWeb3JsKeypair(user));
    umi.use(signerIdentity(umiSigner));

    const metadataPda = findMetadataPda(umi, {
      mint: fromWeb3JsPublicKey(mint),
    });

    const onChainData = {
      name: `SPL ${tokenMintIteration}`,
      symbol: "SPL",
      uri: "https://raw.githubusercontent.com/solana-developers/solana-web3-demo/main/metadata.json",
      sellerFeeBasisPoints: 0,
      creators: [
        {
          address: umiSigner.publicKey,
          verified: false,
          share: 100,
        },
      ],
      collection: none<Collection>(),
      uses: none<Uses>(),
    };

    await createMetadataAccountV3(umi, {
      metadata: metadataPda,
      mint: fromWeb3JsPublicKey(mint),
      mintAuthority: umiSigner,
      payer: umiSigner,
      updateAuthority: umiSigner,
      systemProgram: fromWeb3JsPublicKey(SystemProgram.programId),
      data: onChainData,
      isMutable: true,
      collectionDetails: null,
    }).sendAndConfirm(umi);

    console.log("✅ Metaplex Metadata Account Created.");

    console.log("\n4. Minting 100 tokens to User...");
    const mintAmount = 100 * 10 ** 9;
    const mintSig = await splToken.mintTo(
      connection,
      user,
      mint,
      userAta.address,
      user,
      mintAmount,
    );
    console.log(`✅ Minted 100 tokens. Transaction Signature: ${mintSig}`);

    const [derivativeMintPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("derivative_mint"), mint.toBuffer()],
      programId,
    );
    console.log(
      `✅ Derived Derivative Mint PDA: ${derivativeMintPDA.toBase58()}`,
    );

    console.log("\n5. Saving updated state to state.json...");
    saveState({
      tokenMint: mint.toBase58(),
      derivativeMint: derivativeMintPDA.toBase58(),
      tokenDecimals: 9,
      tokenMintIteration: tokenMintIteration + 1,
    });

    console.log("\n==========================================");
    console.log("  ✅ TOKEN CREATION SUCCESSFUL            ");
    console.log("==========================================");
  } catch (e: any) {
    if (e instanceof SendTransactionError) {
      console.error("❌ Transaction failed. Logs:");
      console.error(await e.getLogs(connection));
    }
    console.error("❌ Fatal error during createToken:", e);
    process.exit(1);
  }
})();
