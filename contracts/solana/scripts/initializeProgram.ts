import { user } from "../env";
import { developer, founder, program } from "./setup";

(async function main() {
  try {
    console.log(`Developer PubKey - ${developer}`);
    console.log(`Founder PubKey - ${founder}`);
    console.log("Initializing Program :-");
    console.log("");
    const sig = await program.methods
      .initializeProgram(developer, founder)
      .accounts({
        signer: user.publicKey,
      })
      .signers([user])
      .rpc();
    console.log("Sig: ", sig);
    console.log("");
  } catch (e: any) {
    console.error("Fatal error:", e);
    process.exit(1);
  }
})();
