import { Blockchain } from "@/types/global";

export const blockchains: Blockchain[] = [
  {
    chainId: 1,
    id: "eth",
    name: "Ethereum",
    logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
    isSupported: true,
  },
  {
    chainId: 8453,
    id: "base",
    name: "Base",
    logoUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/27789.png",
    isSupported: true,
  },
  {
    chainId: null,
    id: "solana",
    name: "Solana",
    logoUrl:
      "https://s3.coinmarketcap.com/static-gravity/image/58ba0011f24d47c4b2e8adaa873bb280.jpg",
    isSupported: true,
  },
];
