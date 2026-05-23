import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { 
  program, 
  programId, 
  developer, 
  founder 
} from "./setup";

(async function main() {
  try {
    console.log("==========================================");
    console.log("  PRINTING GLOBAL INFO                    ");
    console.log("==========================================");
    console.log(`Program ID: ${programId.toBase58()}`);
    console.log(`Developer Key: ${developer.toBase58()}`);
    console.log(`Founder Key: ${founder.toBase58()}`);

    const [globalInfoPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("global_info")],
      programId,
    );
    console.log(`Global Info PDA: ${globalInfoPDA.toBase58()}`);

    console.log("\nFetching GlobalInfo Account...");
    try {
      const globalInfoAccount = await program.account.globalInfo.fetch(globalInfoPDA);
      // ✅ Global Info Account Data retrieved successfully
      console.log("\n✅ Global Info Account Data:");
      console.log(`  Initialized: ${globalInfoAccount.isInitialized}`);
      console.log(`  Developer Wallet: ${globalInfoAccount.developerWallet.toBase58()}`);
      console.log(`  Founder Wallet: ${globalInfoAccount.founderWallet.toBase58()}`);
      console.log(`  Fee Percentage: ${globalInfoAccount.feePercentage}`);
      console.log(`  Fee Percentage Divider: ${globalInfoAccount.feePercentageDivider}`);
      console.log(`  Min Fee for Distribution: ${globalInfoAccount.minFeeForDistribution}`);
      console.log(`  Min Fee: ${globalInfoAccount.minFee}`);
      console.log(`  Developer Fee Share: ${globalInfoAccount.developerFeeShare}%`);
      console.log(`  Founder Fee Share: ${globalInfoAccount.founderFeeShare}%`);
    } catch (e: any) {
      // ❌ Global Info Account is not initialized yet or not found
      console.warn("❌ Global Info Account is not initialized yet or not found.");
      console.warn("👉 Run `npx ts-node initializeProgram.ts` to initialize it.");
    }
    console.log("==========================================");
  } catch (e: any) {
    // ❌ Fatal error occurred
    console.error("❌ Fatal error during printGlobalInfo:", e);
    process.exit(1);
  }
})();
