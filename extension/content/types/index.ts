import { PublicKey } from "@solana/web3.js";
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
export type Issue = {
    amount: number;
    title: string;
    issueNumber: string;
    repo: string;
    org: string;
    state: IssueState;
    pullNumber?: number;
    mint?: PublicKey;
    tags: string[];
    estimatedTime: number;
    description?: string;
    uuid?: string;
  };