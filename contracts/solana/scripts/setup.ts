import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { Twoside } from "../target/types/twoside";
import * as anchor from "@coral-xyz/anchor";
import idl from "../target/idl/twoside.json";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

export const connection = new Connection(
  "https://api.devnet.solana.com",
  "confirmed",
);

export const secretKeySeed = [
  141, 50, 173, 182, 62, 254, 159, 225, 72, 220, 42, 203, 73, 173, 125, 240,
  145, 76, 61, 180, 139, 109, 185, 193, 55, 42, 83, 115, 54, 228, 131, 160, 108,
  106, 246, 135, 4, 166, 200, 62, 121, 213, 61, 51, 71, 8, 15, 152, 104, 168,
  67, 209, 205, 169, 230, 244, 245, 151, 129, 119, 48, 136, 219, 206,
];

export const tokenMint = new PublicKey(
  "9VEYS965KtCYMY9ywP72BPcuGK22YRD6sKyGFxUeWGNb",
);
export const derivativeMint = new PublicKey(
  "ETaXwgKrv4hEM491fVX675UWpRhTV2UE66WK8jhAXKYR",
);

export const tokenDecimals = 9;

export const tokenMetaplexAccount = new PublicKey(
  "DSX6i4R3Ksj3xi1Xhzn2RCRPbRm1p5jgSgkf1T3qdCfd",
);

export const user = Keypair.fromSecretKey(Uint8Array.from(secretKeySeed));

export const userAta = getAssociatedTokenAddressSync(tokenMint, user.publicKey);
export const userDerivativeAta = getAssociatedTokenAddressSync(
  derivativeMint,
  user.publicKey,
);

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

export const programId = new PublicKey(
  "AoxE7YgvjxSHt9dCQAqruwYL3ksG8s8nSZUKABwkr2AQ",
);

export const developer = Keypair.fromSecretKey(
  bs58.decode(
    "4WUnGQLqQCnuHbQnG7PvGjnRZkvh4EgxxCbMDxZLVFB6oT16KQfJNbYkdGNV5nRNxLKBx6WXz1sdgG7rw2iPjnoF",
  ),
);

export const founder = new PublicKey(
  "A2NgwpXFgKvQ9yKzt6eHvgefXT5VSD2kuRrwyVHaM9DW",
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
