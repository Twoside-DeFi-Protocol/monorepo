import { Program, AnchorProvider, setProvider } from "@anchor-lang/core";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import type { Twoside } from "./idlType";
import idl from "./idl.json";

const { connection } = useConnection();

const wallet = useAnchorWallet();
if (!wallet) {
  throw new Error("Wallet not connected");
}

const provider = new AnchorProvider(connection, wallet, {});
setProvider(provider);

export const program = new Program(idl as Twoside, {
  connection,
});
