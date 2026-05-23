import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

export const secretKeySeed = [0];

export const user = Keypair.fromSecretKey(bs58.decode(""));
