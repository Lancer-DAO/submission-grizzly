import { DB } from "../db";
import {
  IssueGetParams,
  IssueInsertParams,
  IssueUpdateParams,
} from "../types";

// ISSUE

export const insertIssue = async (params: IssueInsertParams) => {
    let query =
      "INSERT INTO issue (issue_number, title, repo, org, state, estimated_time, private, tags, description)";
    query += ` VALUES (${params.issueNumber}, '${
      params.title
    }', '${params.repo}', '${
      params.org
    }', 'new', ${
      params.estimatedTime
    }, ${
      params.private
    }, ${
      `'{${params.tags.map((tag) => `"${tag}"`).join(", ")}}'`
    }, '${
      params.description.replace("'", "\'")
    }');`;
    console.log(query);
    const result = await DB.raw(query);
    return result;
  };

  export const getIssueByTitle = async (params: IssueGetParams) => {
    let query =
      "SELECT * from issue WHERE ";
    query += `repo='${params.repo}'`
    query += ` AND org='${params.org}'`
    query += ` AND title='${params.title}'`
    console.log(query);
    const result = await DB.raw(query);
    return result.rows.length > 0 ? result.rows[0] : {message: 'NOT FOUND'};
  };

  export const getIssueByNumber = async (params: IssueGetParams) => {
    let query =
      "SELECT * from issue WHERE ";
    query += `repo='${params.repo}'`
    query += ` AND org='${params.org}'`
    query += ` AND issue_number=${params.issueNumber}`
    console.log(query);
    const result = await DB.raw(query);
    return result.rows.length > 0 ? result.rows[0] : {message: 'NOT FOUND'};
  };

  export const getIssueById = async (uuid: string) => {
    let query =
      "SELECT * from issue WHERE ";
    query += `uuid='${uuid}';`
    console.log(query);
    const result = await DB.raw(query);
    return result.rows.length > 0 ? result.rows[0] : {message: 'NOT FOUND'};
  };

  export const updateIssueNumber = async (params: IssueGetParams) => {
    let query =
      `UPDATE issue SET issue_number=${params.issueNumber} where `;
    query += `repo='${params.repo}'`
    query += ` AND org='${params.org}'`
    query += ` AND title='${params.title}'`
    console.log(query);
    const result = await DB.raw(query);
    return result;
  };

  export const updateIssueState = async (params: IssueUpdateParams) => {
    let query =
      `UPDATE issue SET state='${params.state}' where `;
    query += `uuid='${params.uuid}';`
    console.log(query);
    const result = await DB.raw(query);
    return result;
  };

  export const updateIssueHash = async (params: IssueUpdateParams) => {
    let query =
      `UPDATE issue SET funding_hash='${params.hash}', funding_amount='${params.amount}', funding_mint='${params.mint}', state='accepting_applications' where `;
    query += `repo='${params.repo}'`
    query += ` AND org='${params.org}'`
    query += ` AND issue_number='${params.issueNumber}'`
    console.log(query);
    const result = await DB.raw(query);
    return result;
  };

  export const updateIssueEscrowKey = async (params: IssueUpdateParams) => {
    let query =
      `UPDATE issue SET escrow_key='${params.escrowKey}' where `;
    query += `repo='${params.repo}'`
    query += ` AND org='${params.org}'`
    query += ` AND issue_number='${params.issueNumber}'`
    console.log(query);
    const result = await DB.raw(query);
    return result;
  };

  export const updateIssueTimestamp = async (params: IssueUpdateParams) => {
    let query =
      `UPDATE issue SET unix_timestamp='${params.timestamp}' where `;
    query += `repo='${params.repo}'`
    query += ` AND org='${params.org}'`
    query += ` AND issue_number='${params.issueNumber}'`
    console.log(query);
    const result = await DB.raw(query);
    return result;
  };


export const getAllIssues = async () => {
    let query =
      "SELECT pr.pull_number, i.private, i.unix_timestamp, i.description, i.escrow_key, i.uuid, i.tags, i.estimated_time, i.title, i.funding_amount, i.funding_mint, i.issue_number, i.funding_hash, i.org, i.repo, i.state "

    query += ` from issue as i`
    query += ` LEFT OUTER JOIN pull_request as pr`
    query += ` ON pr.issue_uuid = i.uuid`
    query += ` ORDER BY i.unix_timestamp DESC`
    console.log(query);
    const result = await DB.raw(query);
    return result.rows.length > 0 ? result.rows : {message: 'NOT FOUND'};
  };

  export const getAllIssuesForUser = async (uuid: string) => {
    let query =
      "SELECT pr.pull_number, i.private, i.unix_timestamp, i.description, i.escrow_key, i.uuid, i.tags, i.estimated_time, i.title, i.funding_amount, i.funding_mint, i.issue_number, i.funding_hash, i.org, i.repo, i.state, ai.relations "

    query += ` from issue as i`
    query += ` LEFT OUTER JOIN pull_request as pr`
    query += ` ON pr.issue_uuid = i.uuid`
    query += ` LEFT OUTER JOIN account_issue as ai`
    query += ` ON ai.issue_uuid = i.uuid`
    query += ` WHERE ai.account_uuid = '${uuid}'`
    query += ` ORDER BY i.unix_timestamp DESC`

    console.log(query)
    const result = await DB.raw(query);
    return result.rows.length > 0 ? result.rows : {message: 'NOT FOUND'};
  };

  export const getAllIssuesForRepo = async (org:string, repo:string) => {
    let query =
      "SELECT issue_number"

    query += ` from issue as i`
    query += ` WHERE org='${org}' and repo ='${repo}'`
    console.log(query);
    const result = await DB.raw(query);
    return result.rows.length > 0 ? result.rows : {message: 'NOT FOUND'};
  };

  export const getIssueByUuid = async (uuid: string) => {
    let query =
      "SELECT pr.pull_number, i.unix_timestamp, i.description, i.escrow_key, i.uuid, i.tags, i.estimated_time, i.title, i.funding_amount, i.funding_mint, i.issue_number, i.funding_hash, i.org, i.repo, i.state "

    query += ` from issue as i`
    query += ` LEFT OUTER JOIN pull_request as pr`
    query += ` ON pr.issue_uuid = i.uuid`
    query += ` WHERE i.uuid = '${uuid}'`
    console.log(query);
    const result = await DB.raw(query);
    return result.rows.length > 0 ? result.rows[0] : {message: 'NOT FOUND'};
  };

  export const getAccountsForIssue = async (uuid: string) => {
    let query =
      "SELECT a.github_login, a.github_id, a.solana_pubkey, ai.account_uuid, ai.relations "

    query += ` from issue as i`
    query += ` LEFT OUTER JOIN account_issue as ai`
    query += ` ON i.uuid = ai.issue_uuid`
    query += ` LEFT OUTER JOIN account as a`
    query += ` ON ai.account_uuid = a.uuid`
    query += ` WHERE i.uuid = '${uuid}'`
    console.log(query);
    const result = await DB.raw(query);
    return result.rows.length > 0 ? result.rows : {message: 'NOT FOUND'};
  }