import { assert } from "chai";
import * as anchor from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { fetchLogsFromSignature, setup } from "./setup";
import { initialBalance, lockAmount, tokenDecimals } from "./lock";

describe("Token Unlocking Suite 🔓", () => {
  // ==========================================
  // TEST CASE 1: Standard SPL Token Unlock
  // ==========================================
  it("✅ Normal SPL Unlock", async () => {
    console.log("\n--- Starting Test: Normal SPL Unlock ---");
    try {
      const tokenMint = setup.tokenMint;
      assert(
        tokenMint !== null,
        "❌ setup.tokenMint is null (Lock test might have failed)",
      );

      const { pda: derivativeMintPDA } = setup.getDerivativeMint(tokenMint);

      // Derive ATAs using standard Token Program
      let founderAta = await setup.getTokenATA(
        tokenMint,
        setup.founder.publicKey,
        splToken.TOKEN_PROGRAM_ID,
      );
      let developerAta = await setup.getTokenATA(
        tokenMint,
        setup.developer.publicKey,
        splToken.TOKEN_PROGRAM_ID,
      );
      let userTokenAta = await setup.getTokenATA(
        tokenMint,
        setup.user.publicKey,
        splToken.TOKEN_PROGRAM_ID,
      );
      let userDerivativeAta = await setup.getTokenATA(
        derivativeMintPDA,
        setup.user.publicKey,
        splToken.TOKEN_PROGRAM_ID,
      );

      const unlockAmount = 5 * 10 ** tokenDecimals;
      console.log(`Unlocking amount: 5 (${unlockAmount} raw)`);

      // Call Unlock
      const tx = await setup.program.methods
        .unlock(new anchor.BN(unlockAmount))
        .accounts({
          tokenMint: tokenMint,
          signer: setup.user.publicKey,
          signerTokenAta: userTokenAta.address,
          founderAta: founderAta.address,
          developerAta: developerAta.address,
          tokenProgram: splToken.TOKEN_PROGRAM_ID, // ✅ Specify standard Token program
        })
        .signers([setup.user])
        .rpc();
      console.log(`✅ Unlock SPL Tx Signature: ${tx}`);

      // Verify original token mint supply
      const tokenMintAccount = await splToken.getMint(
        setup.connection,
        tokenMint,
        "confirmed",
        splToken.TOKEN_PROGRAM_ID,
      );
      assert(
        tokenMintAccount.supply.toString() == BigInt(initialBalance).toString(),
        "❌ Wrong Original Token Total Supply",
      );

      // Verify derivative token supply (should be: lockAmount - lockFee - unlockAmount)
      const lockFee = setup.calculateFee(lockAmount);
      const derivativeMintAccount = await splToken.getMint(
        setup.connection,
        derivativeMintPDA,
        "confirmed",
        splToken.TOKEN_PROGRAM_ID,
      );
      assert(
        derivativeMintAccount.supply.toString() ==
          BigInt(lockAmount - lockFee - unlockAmount).toString(),
        "❌ Wrong Derivative Token Total Supply",
      );

      // Verify user original token ATA balance
      const unlockFee = setup.calculateFee(unlockAmount);
      const userTokenAtaAccount = await splToken.getAccount(
        setup.connection,
        userTokenAta.address,
        "confirmed",
        splToken.TOKEN_PROGRAM_ID,
      );
      assert(
        userTokenAtaAccount.amount ==
          BigInt(initialBalance - lockAmount + (unlockAmount - unlockFee)),
        "❌ Wrong User Original Token Balance",
      );

      // Verify user derivative token ATA balance (should be: lockAmount - lockFee - unlockAmount)
      const userDerivativeAtaAccount = await splToken.getAccount(
        setup.connection,
        userDerivativeAta.address,
        "confirmed",
        splToken.TOKEN_PROGRAM_ID,
      );
      assert(
        userDerivativeAtaAccount.amount ==
          BigInt(lockAmount - lockFee - unlockAmount),
        "❌ Wrong User Derivative Token Balance",
      );

      // Verify fees distributed to developer and founder (should include lock fee and unlock fee share)
      const feeShare = lockFee / 2 + unlockFee / 2;
      developerAta = await setup.getTokenATA(
        tokenMint,
        setup.developer.publicKey,
        splToken.TOKEN_PROGRAM_ID,
      );
      assert(
        developerAta.amount == BigInt(feeShare),
        "❌ Wrong Developer Fee Balance",
      );

      founderAta = await setup.getTokenATA(
        tokenMint,
        setup.founder.publicKey,
        splToken.TOKEN_PROGRAM_ID,
      );
      assert(
        founderAta.amount == BigInt(feeShare),
        "❌ Wrong Founder Fee Balance",
      );

      console.log("✅ Normal SPL Unlock verification complete and correct.");
    } catch (err: any) {
      console.error("❌ Caught error during Normal SPL Unlock:", err);
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
  // TEST CASE 2: Token-2022 Unlock
  // ==========================================
  it("✅ Token-2022 Unlock", async () => {
    console.log("\n--- Starting Test: Token-2022 Unlock ---");
    try {
      const tokenMint = setup.token2022Mint;
      assert(
        tokenMint !== null,
        "❌ setup.token2022Mint is null (Lock test might have failed)",
      );

      const { pda: derivativeMintPDA } = setup.getDerivativeMint(tokenMint);

      // Derive ATAs using Token-2022 Program
      let founderAta = await setup.getTokenATA(
        tokenMint,
        setup.founder.publicKey,
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      let developerAta = await setup.getTokenATA(
        tokenMint,
        setup.developer.publicKey,
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      let userTokenAta = await setup.getTokenATA(
        tokenMint,
        setup.user.publicKey,
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      let userDerivativeAta = await setup.getTokenATA(
        derivativeMintPDA,
        setup.user.publicKey,
        splToken.TOKEN_2022_PROGRAM_ID,
      );

      const unlockAmount = 5 * 10 ** tokenDecimals;
      console.log(`Unlocking amount: 5 (${unlockAmount} raw)`);

      // Call Unlock
      const tx = await setup.program.methods
        .unlock(new anchor.BN(unlockAmount))
        .accounts({
          tokenMint: tokenMint,
          signer: setup.user.publicKey,
          signerTokenAta: userTokenAta.address,
          founderAta: founderAta.address,
          developerAta: developerAta.address,
          tokenProgram: splToken.TOKEN_2022_PROGRAM_ID, // ✅ Specify Token-2022 program
        })
        .signers([setup.user])
        .rpc();
      console.log(`✅ Unlock Token-2022 Tx Signature: ${tx}`);

      // Verify original token mint supply
      const tokenMintAccount = await splToken.getMint(
        setup.connection,
        tokenMint,
        "confirmed",
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      assert(
        tokenMintAccount.supply.toString() == BigInt(initialBalance).toString(),
        "❌ Wrong Original Token Total Supply",
      );

      // Verify derivative token supply (should be: lockAmount - lockFee - unlockAmount)
      const lockFee = setup.calculateFee(lockAmount);
      const derivativeMintAccount = await splToken.getMint(
        setup.connection,
        derivativeMintPDA,
        "confirmed",
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      assert(
        derivativeMintAccount.supply.toString() ==
          BigInt(lockAmount - lockFee - unlockAmount).toString(),
        "❌ Wrong Derivative Token Total Supply",
      );

      // Verify user original token ATA balance
      const unlockFee = setup.calculateFee(unlockAmount);
      const userTokenAtaAccount = await splToken.getAccount(
        setup.connection,
        userTokenAta.address,
        "confirmed",
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      assert(
        userTokenAtaAccount.amount ==
          BigInt(initialBalance - lockAmount + (unlockAmount - unlockFee)),
        "❌ Wrong User Original Token Balance",
      );

      // Verify user derivative token ATA balance (should be: lockAmount - lockFee - unlockAmount)
      const userDerivativeAtaAccount = await splToken.getAccount(
        setup.connection,
        userDerivativeAta.address,
        "confirmed",
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      assert(
        userDerivativeAtaAccount.amount ==
          BigInt(lockAmount - lockFee - unlockAmount),
        "❌ Wrong User Derivative Token Balance",
      );

      // Verify fees distributed to developer and founder (should include lock fee and unlock fee share)
      const feeShare = lockFee / 2 + unlockFee / 2;
      developerAta = await setup.getTokenATA(
        tokenMint,
        setup.developer.publicKey,
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      assert(
        developerAta.amount == BigInt(feeShare),
        "❌ Wrong Developer Fee Balance",
      );

      founderAta = await setup.getTokenATA(
        tokenMint,
        setup.founder.publicKey,
        splToken.TOKEN_2022_PROGRAM_ID,
      );
      assert(
        founderAta.amount == BigInt(feeShare),
        "❌ Wrong Founder Fee Balance",
      );

      console.log("✅ Token-2022 Unlock verification complete and correct.");
    } catch (err: any) {
      console.error("❌ Caught error during Token-2022 Unlock:", err);
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
