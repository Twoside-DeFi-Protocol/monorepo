import { developer, founder, program, user } from "./setup";

(async function main() {
  try {
    console.log(`Developer PubKey - ${developer.publicKey}`);
    console.log(`Founder PubKey - ${founder}`);
    console.log("Initializing Program :-");
    console.log("");
    const sig = await program.methods
      .initializeProgram(developer.publicKey, founder)
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
