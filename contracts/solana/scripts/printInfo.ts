import { developer, founder, program, programId, user } from "./setup";
import * as anchor from "@coral-xyz/anchor";

(async function main() {
  try {
    console.log(`Founder Key - ${founder}`);
    console.log(`Developer Key - ${developer.publicKey}`);

    const [globalInfoPDA, globalInfoBump] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("global_info")],
        new anchor.web3.PublicKey(programId),
      );
    const globalInfoAccount =
      await program.account.globalInfo.fetch(globalInfoPDA);
    console.log("Global Info :-");
    console.log(globalInfoAccount);
  } catch (e: any) {
    console.error("Fatal error:", e);
    process.exit(1);
  }
})();
