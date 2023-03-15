import { PublicKey } from "@solana/web3.js";
import { SafeEventEmitterProvider } from "@web3auth/base";
import { SolanaWallet } from "@web3auth/solana-provider";

export * from "./createFeatureFundingAccount"
export * from "./fundFeatureAccount"
export * from "./addApprovedSubmitter"
export * from "./removeApprovedSubmitter"
export * from "./getFeatureAccount"
export * from "./submitRequest"
export * from "./denyRequest"
export * from "./approveRequest"
export * from "./voteToCancel"
export * from "./cancelEscrow"

// Anchor's default export sometimes throws an error saying there is no constructor, so
// make a wrapper class here to avoid the error.
export class MyWallet extends SolanaWallet {
    pk: PublicKey;
    constructor(readonly provider: SafeEventEmitterProvider) {
      super(provider);
    }

    set pubkey(pk: PublicKey) {
      this.pk = pk;
    }

    get publicKey(): PublicKey {
      return this.pk;
    }
  }
