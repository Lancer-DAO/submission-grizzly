import { clusterApiUrl, PublicKey } from "@solana/web3.js";
import { IS_MAINNET } from "@/constants";
import { DEVNET_USDC_MINT, MAINNET_RPC, MAINNET_USDC_MINT } from "../constants/web3";

export const shortenPublicKey = (key: PublicKey) => {
  return `${key.toString().slice(0, 4)}...${key.toString().slice(-4)}`;
};

export const getSolscanAddress = (pubkey: PublicKey) => {
  return `https://solscan.io/account/${pubkey.toString()}${IS_MAINNET ? '' : '?cluster=devnet'}`
}

export const getSolscanTX = (hash: string) => {
  return `https://solscan.io/tx/${hash}${IS_MAINNET ? '' : '?cluster=devnet'}`
}

export const getMintName = (mint?: PublicKey) => {
  if(!mint){
    return 'SOL'
  }
  const mintString = mint.toString()
  if(mintString === DEVNET_USDC_MINT || mintString === MAINNET_USDC_MINT) {
    return 'USDC'
  }

  return 'SOL'
}

export const getEndpoint = () => {
  return IS_MAINNET ? MAINNET_RPC: clusterApiUrl("devnet");
}