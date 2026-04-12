import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import type { Twoside } from "./idlType";
import idl from "./idl.json";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

export const useProgram = (): {
  program: Program<Idl> | undefined;
  provider: AnchorProvider | undefined;
} => {
  const { connection } = useConnection();
  const wallet = useWallet();
  let provider;
  let program;

  if (wallet.publicKey) {
    provider = new AnchorProvider(connection, wallet as any, {
      preflightCommitment: "confirmed",
    });

    program = new Program(idl as Twoside, provider);
  } else {
    toast.error("Solana wallet not connected.");
    return {
      program: undefined,
      provider: undefined,
    };
  }

  return { program, provider };
};
