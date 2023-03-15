import {
    PublicKey,
  } from "@solana/web3.js";
  import { getFeatureFundingAccount } from "@/src/onChain";
  import { getApiEndpoint } from "@/src/utils";
  import axios from "axios";
  import {
    DATA_API_ROUTE,
    ISSUE_API_ROUTE,
  } from "@/server/src/constants";
  import Base58 from "base-58";
  import {
    EscrowContract,
    Issue,
    ISSUE_ACCOUNT_RELATIONSHIP,
    Contributor,
    User,
  } from "@/src/types";


const getIssue = (uuid: string) =>
  axios.get(
    `${getApiEndpoint()}${DATA_API_ROUTE}/${ISSUE_API_ROUTE}?id=${uuid}`
  );

const getIssues = (account?: string) =>
  axios.get(
    `${getApiEndpoint()}${DATA_API_ROUTE}/${ISSUE_API_ROUTE}s${
      account ? `?uuid=${account}` : ""
    }`
  );

const getAccounts = (uuid: string) =>
  axios.get(
    `${getApiEndpoint()}${DATA_API_ROUTE}/${ISSUE_API_ROUTE}/accounts?id=${uuid}`
  );

  export const getEscrowContract = async (issue: Issue, program, anchor) => {
    let escrowKey = issue.escrowKey;
    if (!escrowKey) {
      const accounts = await anchor.connection.getParsedProgramAccounts(
        program.programId, // new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
        {
          filters: [
            {
              dataSize: 288, // number of bytes
            },
            {
              memcmp: {
                offset: 8, // number of bytes
                bytes: issue.creator.publicKey.toBase58(), // base58 encoded string
              },
            },
            {
              memcmp: {
                offset: 275, // number of bytes
                bytes: Base58.encode(Buffer.from(issue.timestamp)), // base58 encoded string
              },
            },
          ],
        }
      );
      if (accounts.length === 0) {
        return;
      }

      escrowKey = accounts[0].pubkey;

      axios.put(
        `${getApiEndpoint()}${DATA_API_ROUTE}/${ISSUE_API_ROUTE}/escrow_key`,
        {
          org: issue.org,
          repo: issue.repo,
          issueNumber: issue.issueNumber,
          escrowKey: escrowKey.toString(),
        }
      );
    }
    const escrowContract = await getFeatureFundingAccount(escrowKey, program);
    const newIssue = {
      ...issue,
      escrowContract: escrowContract as unknown as EscrowContract,
      escrowKey: escrowKey,
    };
    return newIssue;
  };

export const queryIssue = async (id: string) => {
  try {
    const issueResponse = await getIssue(id as string);

    const rawIssue = issueResponse.data;
    const issue: Issue = {
      ...rawIssue,
      hash: rawIssue.funding_hash,
      amount: parseFloat(rawIssue.funding_amount),
      pullNumber: rawIssue.pull_number,
      issueNumber: rawIssue.issue_number,
      githubId: rawIssue.github_id,
      payoutHash: rawIssue.payout_hash,
      authorGithub: rawIssue.github_login,
      pubkey: rawIssue.solana_pubkey,
      escrowKey: rawIssue.escrow_key && new PublicKey(rawIssue.escrow_key),
      estimatedTime: parseFloat(rawIssue.estimated_time),
      mint: rawIssue.funding_mint
        ? new PublicKey(rawIssue.funding_mint)
        : undefined,
      timestamp: rawIssue.unix_timestamp,
      description:
        rawIssue.description ||
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Blandit libero volutpat sed cras ornare. Dignissim cras tincidunt lobortis feugiat vivamus at augue eget arcu. A erat nam at lectus urna. Mattis aliquam faucibus purus in massa tempor. A lacus vestibulum sed arcu. Id venenatis a condimentum vitae sapien. Eu lobortis elementum nibh tellus molestie nunc non blandit. Massa sapien faucibus et molestie. Sollicitudin ac orci phasellus egestas tellus rutrum tellus pellentesque eu. Dis parturient montes nascetur ridiculus mus mauris vitae. Tortor posuere ac ut consequat semper viverra nam.",
    };
    console.log("issue", issue);
    // setIssue(issue);
    const accountsResponse = await getAccounts(id as string);
    const rawAccounts = accountsResponse.data;
    const accounts: Contributor[] = rawAccounts.map((account) => {
      return {
        ...account,
        githubLogin: account.github_login,
        githubId: account.github_id,
        publicKey: new PublicKey(account.solana_pubkey),
        uuid: account.account_uuid,
      };
    });

    const newIssue: Issue = {
      ...issue,
      allContributors: accounts,
      creator: accounts.find((submitter) =>
        submitter.relations.includes(ISSUE_ACCOUNT_RELATIONSHIP.Creator)
      ),
      requestedSubmitters: accounts.filter((submitter) =>
        submitter.relations.includes(
          ISSUE_ACCOUNT_RELATIONSHIP.RequestedSubmitter
        )
      ),
      deniedRequesters: accounts.filter((submitter) =>
        submitter.relations.includes(ISSUE_ACCOUNT_RELATIONSHIP.DeniedRequester)
      ),
      approvedSubmitters: accounts.filter((submitter) =>
        submitter.relations.includes(
          ISSUE_ACCOUNT_RELATIONSHIP.ApprovedSubmitter
        )
      ),
      currentSubmitter: accounts.find((submitter) =>
        submitter.relations.includes(
          ISSUE_ACCOUNT_RELATIONSHIP.CurrentSubmitter
        )
      ),
      deniedSubmitters: accounts.filter((submitter) =>
        submitter.relations.includes(ISSUE_ACCOUNT_RELATIONSHIP.DeniedSubmitter)
      ),
      changesRequestedSubmitters: accounts.filter((submitter) =>
        submitter.relations.includes(
          ISSUE_ACCOUNT_RELATIONSHIP.ChangesRequestedSubmitter
        )
      ),
      completer: accounts.find((submitter) =>
        submitter.relations.includes(ISSUE_ACCOUNT_RELATIONSHIP.Completer)
      ),
      cancelVoters: accounts.filter((submitter) =>
        submitter.relations.includes(ISSUE_ACCOUNT_RELATIONSHIP.VotingCancel)
      ),
      needsToVote: accounts.filter(
        (submitter) =>
          !submitter.relations.includes(
            ISSUE_ACCOUNT_RELATIONSHIP.VotingCancel
          ) &&
          submitter.relations.some((relation) =>
            [
              ISSUE_ACCOUNT_RELATIONSHIP.Creator,
              ISSUE_ACCOUNT_RELATIONSHIP.CurrentSubmitter,
              ISSUE_ACCOUNT_RELATIONSHIP.DeniedSubmitter,
              ISSUE_ACCOUNT_RELATIONSHIP.ChangesRequestedSubmitter,
            ].includes(relation)
          )
      ),
    };
    return newIssue;
  } catch (e) {
    console.error(e);
  }
};

export const queryIssues = async (user: User, referrer?: string) => {
  try {
    const issueResponse = await getIssues(
      referrer === "my_bounties" ? user.uuid : undefined
    );

    const rawIssues = issueResponse.data;
    const issues: Issue[] = rawIssues.map((rawIssue) => {
      return {
        ...rawIssue,
        hash: rawIssue.funding_hash,
        amount: parseFloat(rawIssue.funding_amount),
        pullNumber: rawIssue.pull_number,
        issueNumber: rawIssue.issue_number,
        githubId: rawIssue.github_id,
        payoutHash: rawIssue.payout_hash,
        authorGithub: rawIssue.github_login,
        pubkey: rawIssue.solana_pubkey,
        escrowKey: rawIssue.escrow_key && new PublicKey(rawIssue.escrow_key),
        estimatedTime: parseFloat(rawIssue.estimated_time),
        mint: rawIssue.funding_mint
          ? new PublicKey(rawIssue.funding_mint)
          : undefined,
        timestamp: rawIssue.unix_timestamp,
        description: rawIssue.description,
      };
    });
    // filter out private issues that the user is not a part of
    const user_repos_names = user.repos.map((repo) => repo.full_name);
    const filteredIssues = issues.filter((issue) => {
      const full_name = `${issue.org}/${issue.repo}`;
      return user_repos_names.includes(full_name) || !issue.private;
    });

    return filteredIssues;
  } catch (e) {
    console.error(e);
  }
};