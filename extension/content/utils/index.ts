import { PublicKey } from "@solana/web3.js";

export const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const MAINNET_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const EXTENSION_DEV = false;
export const APP_ENDPOINT = 'https://lancer.so/'
export const APP_ENDPOINT_DEV = 'http://localhost:3000/'
export const API_ENDPOINT = 'https://api.lancer.so/'
export const API_ENDPOINT_DEV = 'http://localhost:3001/'
export const getApiEndpointExtension = (): string => {
    return EXTENSION_DEV ? API_ENDPOINT_DEV : API_ENDPOINT;
}

export const getAppEndpointExtension = (): string => {
    return EXTENSION_DEV ? APP_ENDPOINT_DEV : APP_ENDPOINT;
}
export const getMintName = (mint?: PublicKey) => {
    if(!mint){
      return 'USDC'
    }
    const mintString = mint.toString()
    if(mintString === DEVNET_USDC_MINT || mintString === MAINNET_USDC_MINT) {
      return 'USDC'
    }

    return 'SOL'
  }