import { DB } from ".";

const uuid_ext = 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";';

const account = `CREATE TABLE account (
    uuid UUID DEFAULT uuid_generate_v4 (),
    solana_pubkey VARCHAR,
    is_admin BOOLEAN,
    verified BOOLEAN,
    github_id VARCHAR NOT NULL,
    github_login VARCHAR NOT NULL,
		name VARCHAR,
		discord VARCHAR,
		twitter VARCHAR,
		instagram VARCHAR,
    PRIMARY KEY (uuid)
);`;

const issue = `CREATE TABLE issue (
    uuid UUID DEFAULT uuid_generate_v4 (),
		funding_hash VARCHAR,
    funding_amount DECIMAL(20,10),
    funding_mint VARCHAR,
    escrow_key VARCHAR,
    title VARCHAR,
    repo VARCHAR,
    org VARCHAR,
    issue_number DECIMAL(20),
    state VARCHAR,
    type VARCHAR,
    estimated_time DECIMAL(10, 2),
    private BOOLEAN,
    tags VARCHAR[],
    description text,
    unix_timestamp VARCHAR,
    PRIMARY KEY (uuid)
);`;

const pullRequest = `CREATE TABLE pull_request (
  uuid UUID DEFAULT uuid_generate_v4 (),
  title VARCHAR,
  repo VARCHAR,
  org VARCHAR,
  pull_number DECIMAL(20),
  issue_uuid UUID,
  payout_hash VARCHAR,
  CONSTRAINT fk_issue_pr FOREIGN KEY(issue_uuid) REFERENCES issue(uuid),
  PRIMARY KEY (uuid)
);`;

const accountIssueAssoc = `CREATE TABLE account_issue (
  account_uuid UUID,
  issue_uuid UUID,
  PRIMARY KEY (account_uuid, issue_uuid),
  relations VARCHAR[],
  CONSTRAINT fk_account FOREIGN KEY(account_uuid) REFERENCES account(uuid),
  CONSTRAINT fk_issue FOREIGN KEY(issue_uuid) REFERENCES issue(uuid)
);`;

const accountPullRequestAssoc = `CREATE TABLE account_pull_request (
  account_uuid UUID,
  pull_request_uuid UUID,
  PRIMARY KEY (account_uuid, pull_request_uuid),
  CONSTRAINT fk_account FOREIGN KEY(account_uuid) REFERENCES account(uuid),
  CONSTRAINT fk_pull_request FOREIGN KEY(pull_request_uuid) REFERENCES pull_request(uuid),
  amount DECIMAL(10,10)
);`;

export async function migrate() {
  await DB.raw("begin", []);
  await DB.raw(uuid_ext, []);
  await DB.raw(account, []);
  await DB.raw(issue, []);
  await DB.raw(pullRequest, []);
  await DB.raw(accountIssueAssoc, []);
  await DB.raw(accountPullRequestAssoc, []);
  await DB.raw("commit", []);
}

migrate();
