import { assert } from "chai";
import { setup } from "./setup";

describe("Program Initialization Suite ⚙️", () => {
  before(async () => {
    // ✅ Initialize setup helper
    await setup.initialize();
  });

  it("✅ Normal Initialization", async () => {
    console.log("\n--- Starting Test: Normal Program Initialization ---");

    // Call Initialize Program
    await setup.program.methods
      .initializeProgram(setup.developer.publicKey, setup.founder.publicKey)
      .accounts({
        signer: setup.user.publicKey,
      })
      .signers([setup.user])
      .rpc();
    console.log("✅ Program initialized successfully on-chain.");

    // Fetch and check initialized config
    const globalInfoAccount = await setup.program.account.globalInfo.fetch(
      setup.globalInfoPDA,
    );

    const developerWalletStr = globalInfoAccount.developerWallet.toBase58();
    const founderWalletStr = globalInfoAccount.founderWallet.toBase58();
    const feePercentageNum = globalInfoAccount.feePercentage;
    const feeDividerNum = globalInfoAccount.feePercentageDivider;
    const developerFeeShareNum = globalInfoAccount.developerFeeShare;
    const founderFeeShareNum = globalInfoAccount.founderFeeShare;
    const minFee = globalInfoAccount.minFee;
    const minFeeForDistribution = globalInfoAccount.minFeeForDistribution;

    // Assert correct program configuration
    assert(
      setup.founder.publicKey.toString() == founderWalletStr,
      "❌ Wrong Founder Address Set",
    );
    assert(
      setup.developer.publicKey.toString() == developerWalletStr,
      "❌ Wrong Developer Address Set",
    );
    assert(feePercentageNum == 5, "❌ Wrong feePercentage Set");
    assert(feeDividerNum == 1000, "❌ Wrong feePercentageDivider Set");
    assert(developerFeeShareNum == 50, "❌ Wrong developerFeeShare Set");
    assert(founderFeeShareNum == 50, "❌ Wrong founderFeeShare Set");
    assert(minFee == 2, "❌ Wrong minFee Set");
    assert(minFeeForDistribution == 2, "❌ Wrong minFeeForDistribution Set");

    console.log(
      "✅ Initialization configuration verification complete and correct.",
    );
  });
});
