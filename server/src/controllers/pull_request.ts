import { DB } from "../db";
import {
  PullRequestInsertParams,
  PullRequestGetParams,
  LinkPullRequestParams,
  NewPullRequestParams,
  GetFullPullRequest,
  PullRequestUpdateParams,
} from "../types";
import { getAccount, insertAccount } from "./account";
import { getAccountPullRequest } from "./account_pull_request";
import { getIssueByNumber } from "./issue";

// PULL REQUEST

export const insertPullRequest = async (params: PullRequestInsertParams) => {
  let query = "INSERT INTO pull_request (title, repo, org, pull_number)";
  query += ` VALUES ('${params.title}', '${params.repo}', '${params.org}', ${params.pullNumber});`;
  console.log(query);
  const result = await DB.raw(query);
  return result;
};

export const getPullRequestByNumber = async (params: PullRequestGetParams) => {
  let query = "SELECT * from pull_request WHERE ";
  query += `repo='${params.repo}'`;
  query += ` AND org='${params.org}'`;
  query += ` AND pull_number=${params.pullNumber}`;
  console.log(query);
  const result = await DB.raw(query);
  return result.rows.length > 0 ? result.rows[0] : { message: "NOT FOUND" };
};

export const updatePullRequestPayout = async (
  params: PullRequestUpdateParams
) => {
  let query = `UPDATE pull_request set payout_hash='${params.payoutHash}' WHERE `;

  query += `repo='${params.repo}'`;
  query += ` AND org='${params.org}'`;
  query += ` AND pull_number=${params.pullNumber}`;
  console.log(query);
  const result = await DB.raw(query);
  return result;
};

export const newPullRequest = async (params: NewPullRequestParams) => {
  let pullRequest = await getPullRequestByNumber(params);
  if (pullRequest.message === "NOT FOUND") {
    console.log((await insertPullRequest(params)).rows);
    pullRequest = await getPullRequestByNumber(params);
  }
  let account = await getAccount(params);
  if (account.message === "NOT FOUND") {
    console.log((await insertAccount(params)).rows);
    account = await getAccount(params);
  }
  let issue = await getIssueByNumber(params);
  let linkedPr = await getAccountPullRequest(params);
  if (linkedPr.message === "NOT FOUND") {
    let query =
      "INSERT INTO account_pull_request (account_uuid, pull_request_uuid)";
    console.log(query);

    query += ` VALUES ('${account.uuid}', '${pullRequest.uuid}');`;
    await DB.raw(query);
  }
  if (issue.state !== "in_progress") {
    let query = `UPDATE issue set state='in_progress' where uuid='${issue.uuid}';`;
    console.log(query);
    await DB.raw(query);
  }

  linkPullRequest(params);
  return { message: "SUCCESS" };
};

export const linkPullRequest = async (params: LinkPullRequestParams) => {
  let pullRequest = await getPullRequestByNumber(params);
  let issue = await getIssueByNumber(params);

  if (!issue || !pullRequest) {
    return { message: "NOT FOUND" };
  }

  let query = "UPDATE pull_request set issue_uuid=";
  query += `'${issue.uuid}' where uuid='${pullRequest.uuid}'`;
  console.log(query);
  const result = await DB.raw(query);
  return result;
};

export const getFullPullRequestByNumber = async (
  params: GetFullPullRequest
) => {
  let query =
    "SELECT i.uuid, pr.payout_hash, pr.org, pr.repo, i.state, i.funding_amount, a.solana_pubkey, i.issue_number, pr.pull_number, i.funding_hash, a.github_login, a.github_id ";

  query += ` from pull_request as pr`;
  query += ` LEFT OUTER JOIN account_pull_request as apr`;
  query += ` ON pr.uuid = apr.pull_request_uuid`;
  query += ` LEFT OUTER JOIN account as a`;
  query += ` ON apr.account_uuid = a.uuid`;
  query += ` INNER JOIN issue as i`;
  query += ` ON i.uuid = pr.issue_uuid`;
  query += ` WHERE pr.repo='${params.repo}'`;
  query += ` AND pr.org='${params.org}'`;
  query += ` AND pr.pull_number=${params.pullNumber}`;
  console.log(query);
  const result = await DB.raw(query);
  return result.rows.length > 0 ? result.rows[0] : { message: "NOT FOUND" };
};
