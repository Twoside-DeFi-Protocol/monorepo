"use client";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

export const SolanaProvider = ({ children }: { children: React.ReactNode }) => {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint =
    process.env.NEXT_PUBLIC_SOL_RPC_URL || clusterApiUrl(network);
  const wsEndpoint =
    process.env.NEXT_PUBLIC_SOL_WS_URL ||
    endpoint.replace("https://", "wss://");

  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={{
        wsEndpoint,
        commitment: "confirmed",
      }}
    >
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
