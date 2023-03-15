import { PublicKey } from "@solana/web3.js";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(timezone);

// USER
export interface AccountInsertParams extends AccountGetParams {
  solanaKey?: string;
  verified?: boolean;
  isAdmin?: boolean;

}

export interface AccountGetParams {
  githubId?: string;
  githubLogin?: string;
}

// ISSUE

export interface IssueInsertParams extends IssueGetParams {

tags: string[],
private: boolean,
estimatedTime: number,
description: string
}

export interface IssueGetParams {

  title?: string,
  repo?: string,
  org?: string,
  issueNumber?: number
}

export interface IssueUpdateParams extends IssueGetParams {
  state?: string
  hash?: string,
  amount?: number,
  mint?: string,
  escrowKey?: string
  timestamp?: string
  uuid?:string;
  }


// PULL REQUEST

export interface PullRequestInsertParams extends PullRequestGetParams {
  title?: string,
  }

  export interface PullRequestGetParams {
    repo?: string,
    org?: string,
    pullNumber: number

  }

  export interface PullRequestUpdateParams extends PullRequestGetParams{
    payoutHash: string
  }

  export interface NewPullRequestParams extends PullRequestInsertParams, AccountGetParams {
    issueNumber: number
  }

  export interface LinkPullRequestParams extends PullRequestGetParams, IssueGetParams {}

  // ACCOUNT ISSUE
  export interface AccountIssueGetParams extends AccountGetParams, IssueGetParams {}
  export interface AccountIssueUpdateParams extends AccountGetParams, IssueGetParams {
    relations: string[];
  }

  export interface AccountIssueNewParams extends AccountInsertParams, IssueInsertParams {}

// ACCOUNT PULL REQUEST
export interface AccountPullRequestGetParams extends AccountGetParams, PullRequestGetParams {
}
export interface AccountPullRequestNewParams extends AccountInsertParams, PullRequestInsertParams {
  amount: number
}

export interface GetFullPullRequest extends LinkPullRequestParams, AccountGetParams {}