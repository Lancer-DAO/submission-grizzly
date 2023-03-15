import { MonoProgram } from "@/escrow/sdk/types/mono_program";
import { Issue, User } from "@/src/types";
import { SolanaWalletContextState } from "@coinflowlabs/react";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { SafeEventEmitterProvider } from "@web3auth/base";
import { Web3AuthCore } from "@web3auth/core";
import { SolanaWallet } from "@web3auth/solana-provider";

export class LancerWallet extends SolanaWallet {
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

  export type LOGIN_STATE =
    | "logged_out"
    | "retrieving_jwt"
    | "initializing_wallet"
    | "getting_user"
    | "initializing_anchor"
    | "ready";

  export type ISSUE_LOAD_STATE =
    | "initializing"
    | "getting_issue"
    | "getting_submitters"
    | "getting_contract"
    | "loaded";

    export interface ILancerContext {
        user: User;
        issue: Issue;
        issues: Issue[];
        loginState: LOGIN_STATE;
        anchor: AnchorProvider;
        program: Program<MonoProgram>;
        web3Auth: Web3AuthCore;
        wallet: LancerWallet;
        issueLoadingState: ISSUE_LOAD_STATE;
        coinflowWallet: SolanaWalletContextState;
        setIssue: (issue: Issue) => void;
        setUser: (user: User) => void;
        setForceGetIssue: (force: boolean) => void;
        setIssueLoadingState: (state: ISSUE_LOAD_STATE) => void;
        login: () => Promise<void>;
        logout: () => Promise<void>;
      }