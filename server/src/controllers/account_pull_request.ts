import { DB } from "../db";
import {
  AccountPullRequestGetParams,
  AccountPullRequestNewParams,
} from "../types";
import { getAccount } from "./account";
import { getPullRequestByNumber } from "./pull_request";

export const insertAccountPullRequest = async (params: AccountPullRequestNewParams) => {
  const pullRequest = await getPullRequestByNumber(params);
  const account = await getAccount(params)

  let query =
    "INSERT INTO account_pull_request (account_uuid, pull_request_uuid)";
  query += ` VALUES ('${
    account.uuid
  }', '${pullRequest.uuid}', ${params.amount});`;
  console.log(query);
  const result = await DB.raw(query);
  return result;
};

export const getAccountPullRequest = async (params: AccountPullRequestGetParams) => {
  const pullRequest = await getPullRequestByNumber(params);
  const account = await getAccount(params)

  let query =
    "SELECT * from account_pull_request WHERE ";
  query += `account_uuid='${account.uuid}'`
  query += ` AND pull_request_uuid='${pullRequest.uuid}';`
  console.log(query);
  const result = await DB.raw(query);
  return result.rows.length > 0 ? result.rows[0] : {message: 'NOT FOUND'};
};

