"use client";
import React, { useEffect } from "react";
import {
  Connector,
  CreateConnectorFn,
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { Blockchain } from "@/types/global";
import { useAtom, useAtomValue } from "jotai";
import { currentUserAtom, selectedBlockchainAtom } from "@/store/global";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { blockchains } from "@/constants/blockchains";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import dynamic from "next/dynamic";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: true },
);

const formatWalletAddress = (address: string | null) => {
  if (!address) return "";
  return `${address.slice(0, 8)}...${address.slice(-4)}`;
};

const handleNoWalletConnectAttempt = (blockchain: Blockchain) => {
  toast.error(`No ${blockchain.name} wallet found.`);
};

const WalletContent: React.FC = () => {
  const {
    address: evmAddress,
    isConnected: isEvmConnected,
    chainId: currentChainId,
  } = useAccount();
  const { disconnectEvmAsync } = useDisconnect();
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
  const selectedBlockchain = useAtomValue(selectedBlockchainAtom);
  const router = useRouter();
  const { switchChain } = useSwitchChain();
  const {
    publicKey: solanaAddress,
    disconnect: disconnectSolana,
    connected: isSolanaConnected,
  } = useWallet();

  const handleDisconnect = async () => {
    if (selectedBlockchain.id == "solana") {
      disconnectSolana();
    } else {
      disconnectEvmAsync();
    }
    router.refresh();
  };

  useEffect(() => {
    if (selectedBlockchain.id == "solana") {
      if (isSolanaConnected && solanaAddress && currentChainId) {
        setCurrentUser({
          address: solanaAddress.toString(),
          loggedIn: true,
          currentBlockchain: selectedBlockchain,
        });
      } else {
        setCurrentUser({
          address: "",
          loggedIn: false,
          currentBlockchain: blockchains[0],
        });
      }
    } else {
      if (isEvmConnected && evmAddress && currentChainId) {
        if (
          selectedBlockchain.chainId &&
          currentChainId != selectedBlockchain.chainId
        ) {
          switchChain({ chainId: selectedBlockchain.chainId });
          return;
        }
        setCurrentUser({
          address: evmAddress,
          loggedIn: true,
          currentBlockchain: selectedBlockchain,
        });
      } else {
        setCurrentUser({
          address: "",
          loggedIn: false,
          currentBlockchain: blockchains[0],
        });
      }
    }
  }, [
    selectedBlockchain,
    evmAddress,
    isEvmConnected,
    solanaAddress,
    isSolanaConnected,
  ]);

  if (selectedBlockchain.id == "solana") {
    if (!isSolanaConnected || !currentUser.loggedIn) {
      return <WalletConnect />;
    }
  } else {
    if (!isEvmConnected || !currentUser.loggedIn) {
      return <WalletConnect />;
    }
  }

  return (
    <div className="flex items-center">
      <div className="rounded-lg py-2 px-4 flex items-center">
        <Badge
          variant="outline"
          className="flex items-center space-x-1 text-custom-primary-text w-32 p-2 rounded-lg"
        >
          <span>
            {selectedBlockchain.id == "solana"
              ? formatWalletAddress(solanaAddress?.toString()!)
              : formatWalletAddress(evmAddress!)}
          </span>
        </Badge>
      </div>
      <Button
        size="lg"
        className="bg-black hover:bg-black text-primary-foreground
                border-primary border-2 transition-all hover:scale-103
                font-bold text-lg px-8 cursor-pointer"
        onClick={handleDisconnect}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Disconnect
      </Button>
    </div>
  );
};

export default WalletContent;

function WalletConnect() {
  const { connect: connectEvm, connectors: evmConnectors } = useConnect();
  const selectedBlockchain = useAtomValue(selectedBlockchainAtom);
  const { switchChain } = useSwitchChain();
  const { isConnected: isEvmConnected, chainId: currentChainId } = useAccount();
  const { connect: connectSolana } = useWallet();

  const handleConnection = (connector?: Connector<CreateConnectorFn>) => {
    const walletAbsent =
      selectedBlockchain.id == "solana"
        ? window.solana == undefined
        : window.ethereum == undefined;
    if (typeof window !== "undefined" && walletAbsent) {
      handleNoWalletConnectAttempt(selectedBlockchain);
      return;
    }
    if (selectedBlockchain.id == "solana") {
      connectSolana();
    } else {
      if (
        isEvmConnected &&
        selectedBlockchain.chainId &&
        currentChainId !== selectedBlockchain.chainId
      ) {
        // If already connected but on wrong chain, switch instead of connect
        switchChain({ chainId: selectedBlockchain.chainId });
      } else {
        // If not connected at all, proceed with normal connection
        if (selectedBlockchain.chainId && connector) {
          connectEvm({ connector, chainId: selectedBlockchain.chainId });
        }
      }
    }
  };

  return (
    <>
      {selectedBlockchain.id == "solana" ? (
        <Button
          onClick={() => {
            handleConnection();
          }}
          size="lg"
          className="bg-black hover:bg-black text-primary-foreground
                border-primary border-2 transition-all hover:scale-103
                font-bold text-lg px-8 cursor-pointer"
        >
          <Wallet className="h-4 w-4" />
          <span>Connect Wallet</span>
        </Button>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="bg-black hover:bg-black text-primary-foreground
                    border-primary border-2 transition-all hover:scale-103
                    font-bold text-lg px-8 cursor-pointer"
            >
              <Wallet className="h-4 w-4" />
              <span>Connect Wallet</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="h-76 w-104 neo-shadow-sm border border-custom-primary-color">
            <DialogHeader className="flex items-center justify-center w-full">
              <DialogTitle className="px-10 text-center text-custom-primary-color text-2xl mt-10">
                Connect a {selectedBlockchain.name} wallet to continue
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-38 w-full">
              <div className="p-4 flex flex-col gap-2">
                {evmConnectors.map((connector) => (
                  <Button
                    key={connector.name}
                    className="bg-transparent hover:bg-transparent
                      text-custom-primary-color shadow-none cursor-pointer"
                    onClick={() => handleConnection(connector)}
                  >
                    <span className="w-full flex justify-between">
                      <span className="w-full flex items-start gap-2">
                        <span className="flex items-center gap-2">
                          {connector.icon ? (
                            <Image
                              src={connector.icon.trim()}
                              alt={connector.name}
                              height={28}
                              width={28}
                            />
                          ) : null}
                          <span className="font-bold">{connector.name}</span>
                        </span>
                      </span>
                      <span className="text-gray-700">
                        {connector.name === "MetaMask" ||
                        connector.name === "Injected"
                          ? "Default"
                          : "Detected"}
                      </span>
                    </span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
