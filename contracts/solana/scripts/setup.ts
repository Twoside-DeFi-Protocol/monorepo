import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Twoside } from "../target/types/twoside";
import * as anchor from "@coral-xyz/anchor";
import idl from "../target/idl/twoside.json";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import "dotenv/config";
import { user } from "../env";

export const connection = new Connection(
  "https://api.mainnet.solana.com",
  "confirmed",
);

// export const tokenMint = new PublicKey(
//   "MEANeD3XDdUmNMsRGjASkSWdC8prLYsoRJ61pPeHctD",
// );

export const tokenMint = new PublicKey(
  "9vmCzsKtNxkj1Fn92fnrmjkXaipVidcnsjuT2baai1h1",
);

// export const tokenMint = new PublicKey(
//   "4pMG6Hg4hNiWJjWBdv6V5GHqvKiaizSaD7ArZRhocCJV",
// );

// export const tokenMint = new PublicKey(
//   "F6VjRjJJfMuSnX9RS1bjGaQMMDYNdXgw4f5aZoUKNnC2",
// );

export const derivativeMint = new PublicKey(
  "ETaXwgKrv4hEM491fVX675UWpRhTV2UE66WK8jhAXKYR",
);

export const tokenDecimals = 9;

export const tokenMetaplexAccount = new PublicKey(
  "DSX6i4R3Ksj3xi1Xhzn2RCRPbRm1p5jgSgkf1T3qdCfd",
);

export const userAta = getAssociatedTokenAddressSync(tokenMint, user.publicKey);
export const userDerivativeAta = getAssociatedTokenAddressSync(
  derivativeMint,
  user.publicKey,
);

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

export const programId = new PublicKey(
  "Ga1AiRNNaLTqrzCehLweLRpYN2JzdTr4GwAqy6pmc4UW",
);

export const developer = new PublicKey(
  "Hk7jimSG5utdV3ytWnZyBBfEyunauvE6XKqT3T5PCCbK",
);

export const founder = new PublicKey(
  "6KfdbgFUsBBqGcumtWLkqExbRtDfMTvJS2srzqp7eMk6",
);

export const provider = new anchor.AnchorProvider(
  connection,
  new anchor.Wallet(user),
);

export const program = new anchor.Program<Twoside>(idl, provider);

export const GLOBAL_INFO_STATIC_SEED = Buffer.from("global_info");
export const TOKEN_INFO_STATIC_SEED = Buffer.from("token_info");
export const VAULT_AUTHORITY_STATIC_SEED = Buffer.from("vault_authority");
export const METADATA_STATIC_SEED = Buffer.from("metadata");
export const DERIVATIVE_AUTHORITY_SEED = Buffer.from("derivative_authority");
export const DERIVATIVE_MINT_STATIC_SEED = Buffer.from("derivative_mint");
