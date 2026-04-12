import { Blockchain, CoinGeckoTokenType } from "@/types/global";

const localTokens: CoinGeckoTokenType[] = [
  {
    chainId: 0,
    address: "9VEYS965KtCYMY9ywP72BPcuGK22YRD6sKyGFxUeWGNb",
    name: "My Token",
    symbol: "MT",
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
