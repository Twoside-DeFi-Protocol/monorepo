import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { 
  program, 
  programId, 
  developer, 
  founder 
} from "./setup";
import { user } from "../env";

(async function main() {
  try {
    console.log("==========================================");
    console.log("  INITIALIZING TWOSIDE PROGRAM            ");
    console.log("==========================================");
    console.log(`Developer Public Key: ${developer.toBase58()}`);
    console.log(`Founder Public Key: ${founder.toBase58()}`);
    console.log(`Signer (Payer): ${user.publicKey.toBase58()}`);

    const [globalInfoPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("global_info")],
      programId,
    );
    console.log(`Derived Global Info PDA: ${globalInfoPDA.toBase58()}`);

    console.log("\nSending InitializeProgram Transaction...");
    const sig = await program.methods
      .initializeProgram(developer, founder)
      .accounts({
        signer: user.publicKey,
        globalInfo: globalInfoPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // ✅ Program Initialized successfully
    console.log(`\n✅ Program Initialized successfully.`);
    console.log(`Transaction Signature: ${sig}`);
    console.log("==========================================");
  } catch (e: any) {
    // ❌ Fatal error occurred
    console.error("❌ Fatal error during program initialization:", e);
    process.exit(1);
  }
})();
