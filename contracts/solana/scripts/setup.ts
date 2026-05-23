import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Twoside } from "../target/types/twoside";
import * as anchor from "@coral-xyz/anchor";
import idl from "../target/idl/twoside.json";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import "dotenv/config";
import { user } from "../env";
import * as fs from "fs";
import * as path from "path";

export const connection = new Connection(
  "https://api.mainnet.solana.com",
  "confirmed",
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

// Shared State definition
export interface SharedState {
  tokenMint: string;
  derivativeMint: string;
  tokenDecimals: number;
  tokenStandard: "standard" | "2022";
}

const STATE_FILE_PATH = path.join(__dirname, "state.json");

const defaultState: SharedState = {
  tokenMint: "9vmCzsKtNxkj1Fn92fnrmjkXaipVidcnsjuT2baai1h1",
  derivativeMint: "ETaXwgKrv4hEM491fVX675UWpRhTV2UE66WK8jhAXKYR",
  tokenDecimals: 9,
  tokenStandard: "standard",
};

let loadedState = defaultState;
// ✅ Check if shared state file exists
if (fs.existsSync(STATE_FILE_PATH)) {
  try {
    loadedState = JSON.parse(fs.readFileSync(STATE_FILE_PATH, "utf-8"));
    console.log(
      `✅ [setup.ts] Loaded shared state from state.json:`,
      loadedState,
    );
  } catch (error) {
    // ❌ Failed to load shared state
    console.error(
      `❌ [setup.ts] Failed to read state.json, using defaults:`,
      error,
    );
  }
} else {
  // ⚠️ No shared state file exists
  console.log(`⚠️ [setup.ts] No state.json found. Using defaults.`);
}

export const tokenMint = new PublicKey(loadedState.tokenMint);
export const derivativeMint = new PublicKey(loadedState.derivativeMint);
export const tokenDecimals = loadedState.tokenDecimals;
export const tokenStandard = loadedState.tokenStandard;

export const tokenProgramId =
  tokenStandard === "2022" ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

// Derive user ATAs dynamically based on standard
export const userAta = getAssociatedTokenAddressSync(
  tokenMint,
  user.publicKey,
  false,
  tokenProgramId,
);

export const userDerivativeAta = getAssociatedTokenAddressSync(
  derivativeMint,
  user.publicKey,
  false,
  tokenProgramId,
);

// Derive token metadata PDA if standard (Metaplex)
export const [tokenMetaplexAccount] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("metadata"),
    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
    tokenMint.toBuffer(),
  ],
  TOKEN_METADATA_PROGRAM_ID,
);

// Helper function to save new state
export function saveState(newState: Partial<SharedState>) {
  const finalState = {
    tokenMint: newState.tokenMint ?? tokenMint.toBase58(),
    derivativeMint: newState.derivativeMint ?? derivativeMint.toBase58(),
    tokenDecimals: newState.tokenDecimals ?? tokenDecimals,
    tokenStandard: newState.tokenStandard ?? tokenStandard,
  };
  fs.writeFileSync(
    STATE_FILE_PATH,
    JSON.stringify(finalState, null, 2),
    "utf-8",
  );
  // ✅ Saved state successfully
  console.log(`✅ [setup.ts] Saved shared state to state.json:`, finalState);
}

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
