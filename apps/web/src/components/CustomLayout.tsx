"use client";
import React, { ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { wagmiConfig } from "@/features/wallet/config/wagmiConfig";
import { Toaster } from "./ui/sonner";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { DialogProvider } from "./Dialog";
import { TooltipProvider } from "./ui/tooltip";
import { SolanaProvider } from "@/features/wallet/config/solanaConfig";

export function CustomLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            console.log("Something went wrong!");
            console.log(`More Details: ${error.message}`);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            console.log("Something went wrong!");
            console.log(`More Details: ${error.message}`);
          },
        }),
      }),
  );

  return (
    <DialogProvider>
      <TooltipProvider>
        <SolanaProvider>
          <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
            <QueryClientProvider client={queryClient}>
              <div
                style={{
                  backgroundImage: "radial-gradient(#ddd 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
              >
                <Header />
                {children}
                <Footer />
                <Toaster position="bottom-right" richColors />
              </div>
            </QueryClientProvider>
          </WagmiProvider>
        </SolanaProvider>
      </TooltipProvider>
    </DialogProvider>
  );
}
