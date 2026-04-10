import * as anchor from "@coral-xyz/anchor";
import * as splToken from "@solana/spl-token";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { useConnection } from "@solana/wallet-adapter-react";
import { envVariables } from "@/lib/envVariables";

const METADATA_STATIC_SEED: Buffer<ArrayBuffer> = Buffer.from("metadata");

export const developerKey = new anchor.web3.PublicKey(
  envVariables.solana.developer,
);
export const founderKey = new anchor.web3.PublicKey(
  envVariables.solana.founder,
);

const { connection } = useConnection();

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
