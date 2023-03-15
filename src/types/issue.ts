import { PublicKey } from "@solana/web3.js";

export enum ISSUE_ACCOUNT_RELATIONSHIP {
  Creator = 'creator',
  RequestedSubmitter = 'requested_submitter',
  DeniedRequester = 'denied_requester',
  ApprovedSubmitter = 'approved_submitter',
  CurrentSubmitter = 'current_submitter',
  DeniedSubmitter = 'denied_submitter',
  ChangesRequestedSubmitter = 'changes_requested_submitter',
  Completer = 'completer',
  VotingCancel = 'voting_cancel'
}

export interface AccountCommon {
  publicKey: PublicKey;
  githubId: string;
  githubLogin: string;
  name: string;
  uuid: string;
  relations?: ISSUE_ACCOUNT_RELATIONSHIP[];
}

export interface Contributor extends AccountCommon  {
  relations: ISSUE_ACCOUNT_RELATIONSHIP[];
}

export interface User extends AccountCommon  {
  token?: string;
  isCreator?: boolean,
  isRequestedSubmitter?: boolean,
  isDeniedRequester?: boolean,
  isApprovedSubmitter?: boolean,
  isCurrentSubmitter?: boolean,
  isDeniedSubmitter?: boolean,
  isChangesRequestedSubmitter?: boolean,
  isCompleter?: boolean,
  isVotingCancel?: boolean
  repos?: any[];
}

export type EscrowContract = {
  approvedSubmitters: PublicKey [];
  creator: PublicKey;
  currentSubmitter: PublicKey;
  funderCancel: boolean;
  fundsDataAccountBump: number;
  fundsMint: PublicKey;
  fundsTokenAccount: PublicKey;
  fundsTokenAccountBump: number;
  noOfSubmitters: number;
  payoutAccount: PublicKey;
  payoutCancel: boolean;
  programAuthorityBump: number;
  requestSubmitter: boolean;
  unixTimestamp: string;
}

export type Issue = {
    amount: number;
    hash?: string;
    title: string;
    issueNumber?: string;
    repo: string;
    org: string;
    paid?: boolean;
    state: IssueState;
    private?: boolean;
    type?: IssueType;
    author?: string;
    pubkey?: string;
    pullNumber?: number;
    githubId?: string;
    payoutHash?: string;
    mint?: PublicKey;
    tags: string[];
    estimatedTime: number;
    description?: string;
    uuid?: string;
    escrowKey?: PublicKey;
    timestamp?:string;
    allContributors?: Contributor[];
    creator?: Contributor;
    requestedSubmitters?: Contributor[];
    deniedRequesters?: Contributor[];
    approvedSubmitters?: Contributor[];
    currentSubmitter?: Contributor;
    deniedSubmitters?: Contributor[];
    changesRequestedSubmitters?: Contributor[];
    completer?: Contributor;
    cancelVoters?: Contributor[];
    needsToVote?: Contributor[];
    escrowContract: EscrowContract
  };


  export type ContributorCompensationInfo = {
    pubkey: string;
    name: string;
    picture: string;
    amount: number;
    signature?: string;
  };

  export enum IssueState {
    NEW = "new",
    FUNDED = "funded",
    ACCEPTING_APPLICATIONS = "accepting_applications",
    IN_PROGRESS = "in_progress",
    AWAITING_REVIEW = "awaiting_review",
    COMPLETE = "complete",
    VOTING_TO_CANCEL = "voting_to_cancel",
    CANCELED = "canceled",
  }

  export enum IssueType {
    BUG = "bug",
    DOCUMENTATION = "documentation",
    TEST = "test",
    FEATURE = "feature",
  }