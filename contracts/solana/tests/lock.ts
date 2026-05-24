import { assert } from "chai";
import * as anchor from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  deserializeMetadata,
  getDataV2Serializer,
  MPL_TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { fetchLogsFromSignature, setup } from "./setup";
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { RpcAccount } from "@metaplex-foundation/umi";

export const tokenDecimals = 9;
export const tokenMetadata = {
  name: "MyToken",
  symbol: "MT",
  uri: "https://example.com/metadata.json",
};

export const initialBalance = 100 * 10 ** tokenDecimals;
export const lockAmount = 10 * 10 ** tokenDecimals;

describe("Token Locking Suite 🔒", () => {
  // ==========================================
  // TEST CASE 1: Standard SPL Token Lock
  // ==========================================
  it("✅ Normal SPL Lock", async () => {
    console.log("\n--- Starting Test: Normal SPL Lock ---");
    try {
      // 1. Create standard token mint
      const tokenMint = await setup.generateTokenMint(tokenDecimals);
      const tokenAccount = await splToken.getMint(setup.connection, tokenMint);
      const { pda: derivativeMint } = setup.getDerivativeMint(tokenMint);

      assert(
        tokenAccount.isInitialized == true,
        "❌ Token Mint Not Initialized",
      );
      assert(
        tokenAccount.decimals == tokenDecimals,
        "❌ Wrong Token Decimals Set",
      );
      assert(
        tokenAccount.mintAuthority.toString() ==
          setup.payer.publicKey.toString(),
        "❌ Wrong Mint Authority",
      );
      assert(
        tokenAccount.freezeAuthority.toString() ==
          setup.payer.publicKey.toString(),
        "❌ Wrong Freeze Authority",
      );
      assert(tokenAccount.supply == BigInt(0), "❌ Wrong Token Supply");

      // 2. Deploy Metaplex metadata
      const { pda: tokenMetadataPDA } = setup.getTokenMetadataPDA(tokenMint);
      const { pda: derivativeMetadataPDA } =
        setup.getTokenMetadataPDA(derivativeMint);

      await setup.deployMetaplexMetadata(
        tokenMetadata.name,
        tokenMetadata.symbol,
        tokenMetadata.uri,
        tokenMint,
      );

      // 3. Create ATAs using Standard Token Program
      const userTokenAta = await setup.getTokenATA(
        tokenMint,
        setup.user.publicKey,
        splToken.TOKEN_PROGRAM_ID,
      );
      const { ata: vaultAtaPDA } = setup.getTokenVault(
        tokenMint,
        splToken.TOKEN_PROGRAM_ID,
      );
      const founderAta = await setup.getTokenATA(
        tokenMint,
        setup.founder.publicKey,
        splToken.TOKEN_PROGRAM_ID,
      );
      const developerAta = await setup.getTokenATA(
        tokenMint,
        setup.developer.publicKey,
        splToken.TOKEN_PROGRAM_ID,
      );

      // 4. Mint tokens to user
      await splToken.mintTo(
        setup.connection,
        setup.payer,
        tokenMint,
        userTokenAta.address,
        setup.payer.publicKey,
        initialBalance,
      );

      const userTokenAtaAccount = await splToken.getAccount(
        setup.connection,
        userTokenAta.address,
        "confirmed",
        splToken.TOKEN_PROGRAM_ID,
      );
      assert(
        userTokenAtaAccount.amount == BigInt(initialBalance),
        "❌ Wrong User Token Balance",
      );

      // 5. Send Lock Transaction
      const tx = await setup.program.methods
        .lock(new anchor.BN(lockAmount))
        .accounts({
          tokenMint: tokenMint,
          tokenMetadata: tokenMetadataPDA,
          signer: setup.user.publicKey,
          signerTokenAta: userTokenAta.address,
          developerAta: developerAta.address,
          founderAta: founderAta.address,
          mplTokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
        })
        .signers([setup.user])
        .rpc();
      console.log(`✅ Lock Tx Signature: ${tx}`);

      // 6. Assertions on program state & balances
      const { pda: tokenInfoPDA } = setup.getTokenInfoPDA(tokenMint);
      const tokenInfo =
        await setup.program.account.tokenInfo.fetch(tokenInfoPDA);

      assert(tokenInfo.isInitialized, "❌ Token Info Not Initialized");
      assert(
        tokenInfo.originalMint.toString() == tokenMint.toString(),
        "❌ Wrong Token Mint Set",
      );
      assert(
        tokenInfo.derivativeMint.toString() == derivativeMint.toString(),
        "❌ Wrong Derivative Mint Set",
      );

      const derivativeMintAccount = await splToken.getMint(
        setup.connection,
        derivativeMint,
        "confirmed",
        splToken.TOKEN_PROGRAM_ID,
      );
      assert(
        derivativeMintAccount.isInitialized == true,
        "❌ Derivative Mint Not Initialized",
      );
      assert(
        derivativeMintAccount.decimals == tokenDecimals,
        "❌ Wrong Derivative Token Decimals",
      );

      const { pda: derivativeAuthorityPDA } =
        setup.getDerivativeAuthority(tokenMint);
      assert(
        derivativeMintAccount.mintAuthority.toString() ==
          derivativeAuthorityPDA.toString(),
        "❌ Wrong Derivative Mint Authority",
      );
      assert(
        derivativeMintAccount.freezeAuthority.toString() ==
          derivativeAuthorityPDA.toString(),
        "❌ Wrong Derivative Freeze Authority",
      );
      assert(
        derivativeMintAccount.supply.toString() ==
          BigInt(lockAmount * 0.995).toString(),
        "❌ Wrong Derivative Total Supply",
      );

      const feeShare = (lockAmount * 5) / 2000;
      const developerAtaAccount = await splToken.getAccount(
        setup.connection,
        developerAta.address,
        "confirmed",
        splToken.TOKEN_PROGRAM_ID,
      );
      assert(
        developerAtaAccount.amount == BigInt(feeShare),
        "❌ Wrong Developer ATA Balance",
      );

      const founderAtaAccount = await splToken.getAccount(
        setup.connection,
        founderAta.address,
        "confirmed",
        splToken.TOKEN_PROGRAM_ID,
      );
      assert(
        founderAtaAccount.amount == BigInt(feeShare),
        "❌ Wrong Founder ATA Balance",
      );

      // Verify Metaplex metadata of derivative
      const derivativeMetadataAccount = await setup.umi.rpc.getAccount(
        fromWeb3JsPublicKey(derivativeMetadataPDA),
      );
      const derivativeMetadata = deserializeMetadata(
        derivativeMetadataAccount as RpcAccount,
      );
      const derivativeName = setup.getDerivativeName(tokenMetadata.name);
      const derivativeSymbol = setup.getDerivativeSymbol(tokenMetadata.symbol);

      assert(
        derivativeMetadata.name.toString().trim() == derivativeName.trim(),
        "❌ Wrong Derivative Name",
      );
      assert(
        derivativeMetadata.symbol.toString().trim() == derivativeSymbol.trim(),
        "❌ Wrong Derivative Symbol",
      );
      assert(
        derivativeMetadata.uri.toString().trim() == tokenMetadata.uri.trim(),
        "❌ Wrong Derivative URI",
      );
      assert(
        derivativeMetadata.mint.toString() == derivativeMint.toString(),
        "❌ Wrong Derivative Metadata Mint",
      );

      const vaultAtaAccount = await splToken.getAccount(
        setup.connection,
        vaultAtaPDA,
        "confirmed",
        splToken.TOKEN_PROGRAM_ID,
      );
      assert(
        vaultAtaAccount.amount == BigInt(lockAmount - feeShare * 2),
        "❌ Wrong Vault ATA Balance",
      );

      console.log("✅ Normal SPL Lock verification complete and correct.");
    } catch (err: any) {
      console.error("❌ Caught error during Normal SPL Lock:", err);
      const signature =
        err?.signature ?? err?.txSig ?? err?.transactionSignature;
      if (typeof signature === "string") {
        const logs = await fetchLogsFromSignature(
          setup.program.provider.connection,
          signature,
        );
        console.log("Transaction logs:", logs);
      }
      throw err;
    }
  });

  // ==========================================
  // TEST CASE 2: Token-2022 Lock
  // ==========================================
  it("✅ Token-2022 Lock", async () => {
    console.log("\n--- Starting Test: Token-2022 Lock ---");
    try {
      // 1. Create Token-2022 mint with metadata extensions
      const tokenMint = await setup.generateToken2022Mint(
        tokenDecimals,
        tokenMetadata.name,
        tokenMetadata.symbol,
        tokenMetadata.uri,
      );
      const tokenAccount = await splToken.getMint(
        setup.connection,
        tokenMint,
        "confirmed",
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      const { pda: derivativeMint } = setup.getDerivativeMint(tokenMint);

      assert(
        tokenAccount.isInitialized == true,
        "❌ Token-2022 Mint Not Initialized",
      );
      assert(
        tokenAccount.decimals == tokenDecimals,
        "❌ Wrong Token Decimals Set",
      );
      assert(tokenAccount.supply == BigInt(0), "❌ Wrong Token Supply");

      // For Token-2022, tokenMetadata accounts passed to instruction is null (None in Rust)
      const { pda: derivativeMetadataPDA } =
        setup.getTokenMetadataPDA(derivativeMint);

      // 2. Create ATAs using Token-2022 Program
      const userTokenAta = await setup.getTokenATA(
        tokenMint,
        setup.user.publicKey,
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      const { ata: vaultAtaPDA } = setup.getTokenVault(
        tokenMint,
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      const founderAta = await setup.getTokenATA(
        tokenMint,
        setup.founder.publicKey,
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      const developerAta = await setup.getTokenATA(
        tokenMint,
        setup.developer.publicKey,
        splToken.TOKEN_2022_PROGRAM_ID,
      );

      // 3. Mint tokens to user using Token-2022
      await splToken.mintTo(
        setup.connection,
        setup.payer,
        tokenMint,
        userTokenAta.address,
        setup.payer.publicKey,
        initialBalance,
        [],
        { commitment: "confirmed" },
        splToken.TOKEN_2022_PROGRAM_ID,
      );

      const userTokenAtaAccount = await splToken.getAccount(
        setup.connection,
        userTokenAta.address,
        "confirmed",
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      assert(
        userTokenAtaAccount.amount == BigInt(initialBalance),
        "❌ Wrong User Token-2022 Balance",
      );

      // 4. Send Lock Transaction
      const tx = await setup.program.methods
        .lock(new anchor.BN(lockAmount))
        .accounts({
          tokenMint: tokenMint,
          tokenMetadata: null, // ✅ Pass null for native Token-2022 metadata
          signer: setup.user.publicKey,
          signerTokenAta: userTokenAta.address,
          developerAta: developerAta.address,
          founderAta: founderAta.address,
          mplTokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
          tokenProgram: splToken.TOKEN_2022_PROGRAM_ID, // ✅ Specify Token-2022 Program
        })
        .signers([setup.user])
        .rpc();
      console.log(`✅ Lock Token-2022 Tx Signature: ${tx}`);

      // 5. Assertions on program state & balances
      const { pda: tokenInfoPDA } = setup.getTokenInfoPDA(tokenMint);
      const tokenInfo =
        await setup.program.account.tokenInfo.fetch(tokenInfoPDA);

      assert(tokenInfo.isInitialized, "❌ Token Info Not Initialized");
      assert(
        tokenInfo.originalMint.toString() == tokenMint.toString(),
        "❌ Wrong Token Mint Set",
      );
      assert(
        tokenInfo.derivativeMint.toString() == derivativeMint.toString(),
        "❌ Wrong Derivative Mint Set",
      );

      const derivativeMintAccount = await splToken.getMint(
        setup.connection,
        derivativeMint,
        "confirmed",
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      assert(
        derivativeMintAccount.isInitialized == true,
        "❌ Derivative Mint Not Initialized",
      );
      assert(
        derivativeMintAccount.decimals == tokenDecimals,
        "❌ Wrong Derivative Token Decimals",
      );

      const { pda: derivativeAuthorityPDA } =
        setup.getDerivativeAuthority(tokenMint);
      assert(
        derivativeMintAccount.mintAuthority.toString() ==
          derivativeAuthorityPDA.toString(),
        "❌ Wrong Derivative Mint Authority",
      );
      assert(
        derivativeMintAccount.freezeAuthority.toString() ==
          derivativeAuthorityPDA.toString(),
        "❌ Wrong Derivative Freeze Authority",
      );
      assert(
        derivativeMintAccount.supply.toString() ==
          BigInt(lockAmount * 0.995).toString(),
        "❌ Wrong Derivative Total Supply",
      );

      const feeShare = (lockAmount * 5) / 2000;
      const developerAtaAccount = await splToken.getAccount(
        setup.connection,
        developerAta.address,
        "confirmed",
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      assert(
        developerAtaAccount.amount == BigInt(feeShare),
        "❌ Wrong Developer ATA Balance",
      );

      const founderAtaAccount = await splToken.getAccount(
        setup.connection,
        founderAta.address,
        "confirmed",
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      assert(
        founderAtaAccount.amount == BigInt(feeShare),
        "❌ Wrong Founder ATA Balance",
      );

      // Verify Metaplex metadata of derivative (always Metaplex for derivative)
      const derivativeMetadataAccount = await setup.umi.rpc.getAccount(
        fromWeb3JsPublicKey(derivativeMetadataPDA),
      );
      const derivativeMetadata = deserializeMetadata(
        derivativeMetadataAccount as RpcAccount,
      );
      const derivativeName = setup.getDerivativeName(tokenMetadata.name);
      const derivativeSymbol = setup.getDerivativeSymbol(tokenMetadata.symbol);

      assert(
        derivativeMetadata.name.toString().trim() == derivativeName.trim(),
        "❌ Wrong Derivative Name",
      );
      assert(
        derivativeMetadata.symbol.toString().trim() == derivativeSymbol.trim(),
        "❌ Wrong Derivative Symbol",
      );
      assert(
        derivativeMetadata.uri.toString().trim() == tokenMetadata.uri.trim(),
        "❌ Wrong Derivative URI",
      );
      assert(
        derivativeMetadata.mint.toString() == derivativeMint.toString(),
        "❌ Wrong Derivative Metadata Mint",
      );

      const vaultAtaAccount = await splToken.getAccount(
        setup.connection,
        vaultAtaPDA,
        "confirmed",
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      assert(
        vaultAtaAccount.amount == BigInt(lockAmount - feeShare * 2),
        "❌ Wrong Vault ATA Balance",
      );

      console.log("✅ Token-2022 Lock verification complete and correct.");
    } catch (err: any) {
      console.error("❌ Caught error during Token-2022 Lock:", err);
      const signature =
        err?.signature ?? err?.txSig ?? err?.transactionSignature;
      if (typeof signature === "string") {
        const logs = await fetchLogsFromSignature(
          setup.program.provider.connection,
          signature,
        );
        console.log("Transaction logs:", logs);
      }
      throw err;
    }
  });

  // ==========================================
  // TEST CASE 3: Token-2022 Lock with Metaplex Metadata
  // ==========================================
  it("✅ Token-2022 Lock with Metaplex Metadata", async () => {
    console.log(
      "\n--- Starting Test: Token-2022 Lock with Metaplex Metadata ---",
    );
    try {
      // 1. Create Token-2022 mint without metadata extensions
      const tokenMint = await splToken.createMint(
        setup.connection,
        setup.payer,
        setup.payer.publicKey,
        setup.payer.publicKey,
        tokenDecimals,
        undefined,
        { commitment: "confirmed" },
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      const tokenAccount = await splToken.getMint(
        setup.connection,
        tokenMint,
        "confirmed",
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      const { pda: derivativeMint } = setup.getDerivativeMint(tokenMint);
      setup.token2022MetaplexMint = tokenMint;

      assert(
        tokenAccount.isInitialized == true,
        "❌ Token-2022 Mint Not Initialized",
      );
      assert(
        tokenAccount.decimals == tokenDecimals,
        "❌ Wrong Token Decimals Set",
      );

      // 2. Deploy Metaplex metadata
      const { pda: tokenMetadataPDA } = setup.getTokenMetadataPDA(tokenMint);
      const { pda: derivativeMetadataPDA } =
        setup.getTokenMetadataPDA(derivativeMint);

      await setup.deployMetaplexMetadata(
        tokenMetadata.name,
        tokenMetadata.symbol,
        tokenMetadata.uri,
        tokenMint,
      );

      // 3. Create ATAs using Token-2022 Program
      const userTokenAta = await setup.getTokenATA(
        tokenMint,
        setup.user.publicKey,
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      const { ata: vaultAtaPDA } = setup.getTokenVault(
        tokenMint,
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      const founderAta = await setup.getTokenATA(
        tokenMint,
        setup.founder.publicKey,
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      const developerAta = await setup.getTokenATA(
        tokenMint,
        setup.developer.publicKey,
        splToken.TOKEN_2022_PROGRAM_ID,
      );

      // 4. Mint tokens to user using Token-2022
      await splToken.mintTo(
        setup.connection,
        setup.payer,
        tokenMint,
        userTokenAta.address,
        setup.payer.publicKey,
        initialBalance,
        [],
        { commitment: "confirmed" },
        splToken.TOKEN_2022_PROGRAM_ID,
      );

      // 5. Send Lock Transaction with Metaplex metadata PDA
      const tx = await setup.program.methods
        .lock(new anchor.BN(lockAmount))
        .accounts({
          tokenMint: tokenMint,
          tokenMetadata: tokenMetadataPDA, // ✅ Pass Metaplex metadata PDA
          signer: setup.user.publicKey,
          signerTokenAta: userTokenAta.address,
          developerAta: developerAta.address,
          founderAta: founderAta.address,
          mplTokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
          tokenProgram: splToken.TOKEN_2022_PROGRAM_ID, // ✅ Specify Token-2022 Program
        })
        .signers([setup.user])
        .rpc();
      console.log(
        `✅ Lock Token-2022 with Metaplex Metadata Tx Signature: ${tx}`,
      );

      // 6. Assertions on program state & balances
      const { pda: tokenInfoPDA } = setup.getTokenInfoPDA(tokenMint);
      const tokenInfo =
        await setup.program.account.tokenInfo.fetch(tokenInfoPDA);

      assert(tokenInfo.isInitialized, "❌ Token Info Not Initialized");
      assert(
        tokenInfo.originalMint.toString() == tokenMint.toString(),
        "❌ Wrong Token Mint Set",
      );
      assert(
        tokenInfo.derivativeMint.toString() == derivativeMint.toString(),
        "❌ Wrong Derivative Mint Set",
      );

      const derivativeMintAccount = await splToken.getMint(
        setup.connection,
        derivativeMint,
        "confirmed",
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      assert(
        derivativeMintAccount.isInitialized == true,
        "❌ Derivative Mint Not Initialized",
      );

      const { pda: derivativeAuthorityPDA } =
        setup.getDerivativeAuthority(tokenMint);
      assert(
        derivativeMintAccount.mintAuthority.toString() ==
          derivativeAuthorityPDA.toString(),
        "❌ Wrong Derivative Mint Authority",
      );

      console.log(
        "✅ Token-2022 Lock with Metaplex Metadata verification complete and correct.",
      );
    } catch (err: any) {
      console.error(
        "❌ Caught error during Token-2022 Lock with Metaplex Metadata:",
        err,
      );
      const signature =
        err?.signature ?? err?.txSig ?? err?.transactionSignature;
      if (typeof signature === "string") {
        const logs = await fetchLogsFromSignature(
          setup.program.provider.connection,
          signature,
        );
        console.log("Transaction logs:", logs);
      }
      throw err;
    }
  });
});
