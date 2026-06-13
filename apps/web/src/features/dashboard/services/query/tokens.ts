import { Blockchain, CoinGeckoTokenType } from "@/types/global";

const localTokens: CoinGeckoTokenType[] = [
  {
    chainId: 1,
    address: "74Ki6EoFx2nYCw3FiqTrEMS9tX6Ffiydhoqz9CSZ2GoL",
    name: "T22 2",
    symbol: "T22",
    decimals: 9,
    logoURI: "/token-placeholder.png",
  },
];

export async function getTokensList(
  blockchain: Blockchain,
): Promise<CoinGeckoTokenType[]> {
  try {
    if (blockchain.id == "solana") return localTokens;
    const url = `https://tokens.coingecko.com/${blockchain.name.toLowerCase()}/all.json`;
    const res = await fetch(url);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.tokens;
  } catch (error) {
    console.log(`Error fetching token list for ${blockchain.name}`);
    console.log(error);
    return [];
  }
}
