import { Program, AnchorProvider, type Provider } from "@coral-xyz/anchor";
import type { Twoside } from "./idlType";
import idl from "./idl.json";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";

export const useProgram = (): {
  program: Program<Twoside>;
  provider: Provider;
  isWalletConnected: boolean;
} => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const isWalletConnected = !!wallet.publicKey;

  const provider = useMemo<Provider>(() => {
    if (isWalletConnected) {
      return new AnchorProvider(connection, wallet as any, {
        preflightCommitment: "confirmed",
      });
    }
    return { connection };
  }, [connection, wallet, isWalletConnected]);

  const program: Program<Twoside> = useMemo(() => {
    return new Program(idl as Twoside, provider);
  }, [provider]);

  return { program, provider, isWalletConnected };
};
