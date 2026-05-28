import * as splToken from "@solana/spl-token";

import {
  PublicKey,
  SendTransactionError,
  SystemProgram,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import {
  Collection,
  Uses,
  createV1, // FIX: Use createV1 instead of createMetadataAccountV3
  TokenStandard,
  findMetadataPda,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

import {
  createSignerFromKeypair,
  none,
  signerIdentity,
  percentAmount,
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
  tokenMint2022MetaplexIteration,
} from "./setup";

import { user } from "../env";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

(async function main() {
  try {
    console.log("==========================================");
    console.log("   CREATING TOKEN-2022 WITH METAPLEX       ");
    console.log("==========================================");

    console.log(`Payer/Mint Authority: ${user.publicKey.toBase58()}`);
    console.log(`Developer: ${developer.toBase58()}`);
    console.log(`Founder: ${founder.toBase58()}`);

    console.log("\n1. Creating Token-2022 Mint...");
    const mintKeypair = Keypair.generate();
    const mintLen = splToken.getMintLen([]);
    const lamports =
      await connection.getMinimumBalanceForRentExemption(mintLen);

    const umi = createUmi(connection.rpcEndpoint).use(mplTokenMetadata());
    const umiSigner = createSignerFromKeypair(umi, fromWeb3JsKeypair(user));
    umi.use(signerIdentity(umiSigner));

    const metadataPda = findMetadataPda(umi, {
      mint: fromWeb3JsPublicKey(mintKeypair.publicKey),
    });

    const createMintTx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: user.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: mintLen,
        lamports,
        programId: splToken.TOKEN_2022_PROGRAM_ID,
      }),
      splToken.createInitializeMintInstruction(
        mintKeypair.publicKey,
        9,
        user.publicKey,
        user.publicKey,
        splToken.TOKEN_2022_PROGRAM_ID,
      ),
    );

    await sendAndConfirmTransaction(
      connection,
      createMintTx,
      [user, mintKeypair],
      { commitment: "confirmed" },
    );
    const mint = mintKeypair.publicKey;
    console.log(`✅ Token-2022 Mint Created: ${mint.toBase58()}`);

    await sleep(1500);

    console.log("\n2. Creating Associated Token Accounts...");
    const userAtaCoord = splToken.getAssociatedTokenAddressSync(
      mint,
      user.publicKey,
      false,
      splToken.TOKEN_2022_PROGRAM_ID,
    );
    const developerAtaCoord = splToken.getAssociatedTokenAddressSync(
      mint,
      developer,
      false,
      splToken.TOKEN_2022_PROGRAM_ID,
    );
    const founderAtaCoord = splToken.getAssociatedTokenAddressSync(
      mint,
      founder,
      false,
      splToken.TOKEN_2022_PROGRAM_ID,
    );

    const ataTx = new Transaction().add(
      splToken.createAssociatedTokenAccountInstruction(
        user.publicKey,
        userAtaCoord,
        user.publicKey,
        mint,
        splToken.TOKEN_2022_PROGRAM_ID,
      ),
      splToken.createAssociatedTokenAccountInstruction(
        user.publicKey,
        developerAtaCoord,
        developer,
        mint,
        splToken.TOKEN_2022_PROGRAM_ID,
      ),
      splToken.createAssociatedTokenAccountInstruction(
        user.publicKey,
        founderAtaCoord,
        founder,
        mint,
        splToken.TOKEN_2022_PROGRAM_ID,
      ),
    );

    console.log("Sending ATA creation transaction bundle...");
    await sendAndConfirmTransaction(connection, ataTx, [user], {
      commitment: "confirmed",
    });

    console.log(`✅ User ATA: ${userAtaCoord.toBase58()}`);
    console.log(`✅ Developer ATA: ${developerAtaCoord.toBase58()}`);
    console.log(`✅ Founder ATA: ${founderAtaCoord.toBase58()}`);

    console.log("Waiting for RPC network to index ATAs...");
    await sleep(2000);

    console.log("\n3. Creating Metaplex Metadata Account...");

    // FIX: Execute createV1 which is compatible with Token-2022 program IDs
    const umiMintSigner = createSignerFromKeypair(
      umi,
      fromWeb3JsKeypair(mintKeypair),
    );
    await createV1(umi, {
      mint: umiMintSigner,
      authority: umiSigner,
      payer: umiSigner,
      updateAuthority: umiSigner,
      name: `T22M ${tokenMint2022MetaplexIteration}`,
      symbol: "T22M",
      uri: "https://raw.githubusercontent.com/solana-developers/solana-web3-demo/main/metadata.json",
      sellerFeeBasisPoints: percentAmount(0), // 👈 Fixed: wrapped with percentAmount()
      creators: [
        {
          address: umiSigner.publicKey,
          verified: true,
          share: 100,
        },
      ],
      collection: none<Collection>(),
      uses: none<Uses>(),
      tokenStandard: TokenStandard.Fungible,
      splTokenProgram: fromWeb3JsPublicKey(splToken.TOKEN_2022_PROGRAM_ID),
    }).sendAndConfirm(umi);

    console.log("✅ Metaplex Metadata Account Created.");

    console.log("\n4. Minting 100 tokens to User...");
    const mintAmount = BigInt(100 * 10 ** 9);
    const mintSig = await splToken.mintTo(
      connection,
      user,
      mint,
      userAtaCoord,
      user.publicKey,
      mintAmount,
      [],
      { commitment: "confirmed" },
      splToken.TOKEN_2022_PROGRAM_ID,
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
      tokenMint2022Metaplex: mint.toBase58(),
      derivativeMint2022Metaplex: derivativeMintPDA.toBase58(),
      tokenDecimals: 9,
      tokenMint2022MetaplexIteration: tokenMint2022MetaplexIteration + 1,
    });

    console.log("\n==========================================");
    console.log("   ✅ TOKEN CREATION SUCCESSFUL            ");
    console.log("==========================================");
  } catch (e: any) {
    if (e instanceof SendTransactionError) {
      console.error("❌ Transaction failed. Logs:");
      console.error(await e.getLogs(connection));
    }
    console.error("❌ Fatal error during createToken2022Metaplex:", e);
    process.exit(1);
  }
})();
