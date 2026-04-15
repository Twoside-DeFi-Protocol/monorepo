import * as anchor from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { envVariables } from "@/lib/envVariables";

const METADATA_STATIC_SEED = Buffer.from("metadata");
const TOKEN_INFO_STATIC_SEED = Buffer.from("token_info");

export const developerKey = new anchor.web3.PublicKey(
  envVariables.solana.developer,
);
export const founderKey = new anchor.web3.PublicKey(
  envVariables.solana.founder,
);

export function getTokenMetadataPDA(mint: anchor.web3.PublicKey): {
  pda: anchor.web3.PublicKey;
  bump: number;
} {
  const [derivativeMetadataPDA, derivativeMetadataBump] =
    anchor.web3.PublicKey.findProgramAddressSync(
      [
        METADATA_STATIC_SEED,
        new anchor.web3.PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
        mint.toBuffer(),
      ],
      new anchor.web3.PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID),
    );
  return {
    pda: derivativeMetadataPDA,
    bump: derivativeMetadataBump,
  };
}

export function getTokenATA(
  mint: anchor.web3.PublicKey,
  owner: anchor.web3.PublicKey,
) {
  return splToken.getAssociatedTokenAddressSync(mint, owner);
}

export function getTokenDerivativePDA(mint: anchor.web3.PublicKey): {
  pda: anchor.web3.PublicKey;
  bump: number;
} {
  const [tokenInfoPDA, tokenInfoBump] =
    anchor.web3.PublicKey.findProgramAddressSync(
      [TOKEN_INFO_STATIC_SEED, mint.toBuffer()],
      new anchor.web3.PublicKey(envVariables.twosideContract.solana),
    );
  return {
    pda: tokenInfoPDA,
    bump: tokenInfoBump,
  };
}
