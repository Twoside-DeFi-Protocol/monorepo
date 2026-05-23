import { user } from "../env";

(async function main() {
  try {
    console.log(`Private Key - ${user.secretKey}`);
    console.log(`Public Key - ${user.publicKey}`);
  } catch (e: any) {
    console.error("Fatal error:", e);
    process.exit(1);
  }
})();
