import { DB } from "../db";
import { AccountIssueGetParams, AccountIssueNewParams, AccountIssueUpdateParams } from "../types";
import { getAccount, getAccountById, insertAccount } from "./account";
import { getIssueById, getIssueByTitle, insertIssue } from "./issue";

export const insertAccountIssue = async (params: {accountId: string, issueId: string}) => {
    const issue = await getIssueById(params.issueId);
    const account = await getAccountById(params.accountId)

    let query =
      "INSERT INTO account_issue (account_uuid, issue_uuid, relations)";
    query += ` VALUES ('${
      account.uuid
    }', '${issue.uuid}', '{"requested_submitter"}');`;
    console.log(query);
    const result = await DB.raw(query);
    return result;
  };

  export const updateAccountIssue = async (params: AccountIssueUpdateParams & {accountId: string, issueId: string}) => {
    const issue = await getIssueById(params.issueId);
    const account = await getAccountById(params.accountId)

    let query =
    `UPDATE account_issue set relations='{${params.relations.map((relation) => `"${relation}"`).join(", ")}}'`;

    query += ` WHERE account_uuid='${
      account.uuid
    }' and  issue_uuid='${issue.uuid}';`;
    console.log(query);
    const result = await DB.raw(query);
    return result;
  };

  export const getAccountIssue = async (params: AccountIssueGetParams) => {
    const issue = await getIssueByTitle(params);
    const account = await getAccount(params)

    let query =
      "SELECT * from account_issue WHERE ";
    query += `account_uuid='${account.uuid}'`
    query += ` AND issue_uuid='${issue.uuid}';`
    console.log(query);
    const result = await DB.raw(query);
    return result.rows.length > 0 ? result.rows[0] : {message: 'NOT FOUND'};
  };


  export const newAccountIssue = async (params: AccountIssueNewParams) => {
    let issue = await getIssueByTitle(params);
    if (issue.message === 'NOT FOUND') {
      console.log((await insertIssue(params)).rows)
      issue = await getIssueByTitle(params);
    }
    let account = await getAccount(params);
    if(account.message === 'NOT FOUND') {
      console.log((await insertAccount(params)).rows)
      account = await getAccount(params);
    }

    let query =
      "INSERT INTO account_issue (account_uuid, issue_uuid, relations)";
    query += ` VALUES ('${
      account.uuid
    }', '${issue.uuid}', '{"creator"}');`;
    console.log(query);

    await DB.raw(query);
    const result = {
      message: "Issue Created",
      issue: {
        number: issue.issue_number,
        uuid: issue.uuid
      }
    }
    return result;
  };
