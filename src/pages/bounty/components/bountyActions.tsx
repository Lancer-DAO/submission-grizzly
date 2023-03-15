import {
  ACCOUNT_ISSUE_API_ROUTE,
  DATA_API_ROUTE,
  ISSUE_API_ROUTE,
  MERGE_PULL_REQUEST_API_ROUTE,
} from "@/server/src/constants";
import { LoadingBar } from "@/src/components/LoadingBar";
import {
  addSubmitterFFA,
  approveRequestFFA,
  cancelFFA,
  denyRequestFFA,
  submitRequestFFA,
  voteToCancelFFA,
} from "@/src/onChain";
import { useLancer } from "@/src/providers";
import {
  Contributor,
  IssueState,
  ISSUE_ACCOUNT_RELATIONSHIP,
} from "@/src/types";
import { getApiEndpoint } from "@/src/utils";
import axios from "axios";
import classNames from "classnames";
import { useState } from "react";

export const BountyActions = () => {
  const {
    user,
    issue,
    wallet,
    anchor,
    program,
    setIssue,
    setUser,
    setIssueLoadingState,
    issueLoadingState,
  } = useLancer();
  const [hoveredButton, setHoveredButton] = useState("none");
  if (
    issue &&
    (issue.state === IssueState.CANCELED || issue.state === IssueState.COMPLETE)
  ) {
    return <></>;
  }
  if (
    (!user?.relations || !issue?.escrowContract) &&
    issueLoadingState === "loaded"
  ) {
    return <LoadingBar title="Loading On Chain Details" />;
  }
  const requestToSubmit = async () => {
    if (user.isCreator) {
      // If we are the creator, then skip requesting and add self as approved
      await addSubmitterFFA(
        issue.creator.publicKey,
        issue.creator.publicKey,
        issue.escrowContract,
        wallet,
        anchor,
        program
      );
      user.relations.push(ISSUE_ACCOUNT_RELATIONSHIP.ApprovedSubmitter);
      axios.put(
        `${getApiEndpoint()}${DATA_API_ROUTE}/${ACCOUNT_ISSUE_API_ROUTE}`,
        { accountId: user.uuid, issueId: issue.uuid, relations: user.relations }
      );

      setIssue({
        ...issue,
        state: IssueState.IN_PROGRESS,
        approvedSubmitters: [...issue.approvedSubmitters, issue.creator],
      });
      setUser({
        ...user,
        isApprovedSubmitter: true,
        relations: user.relations,
      });
      setIssueLoadingState("getting_contract");
    } else {
      // Request to submit. Does not interact on chain
      axios.post(
        `${getApiEndpoint()}${DATA_API_ROUTE}/${ACCOUNT_ISSUE_API_ROUTE}`,
        {
          accountId: user.uuid,
          issueId: issue.uuid,
          relations: [ISSUE_ACCOUNT_RELATIONSHIP.RequestedSubmitter],
        }
      );

      setIssue({
        ...issue,
        state: IssueState.IN_PROGRESS,
        requestedSubmitters: [
          ...issue.requestedSubmitters,
          user as Contributor,
        ],
      });
      setUser({
        ...user,
        isRequestedSubmitter: true,
        relations: [ISSUE_ACCOUNT_RELATIONSHIP.RequestedSubmitter],
      });
    }

    axios.put(`${getApiEndpoint()}${DATA_API_ROUTE}/${ISSUE_API_ROUTE}/state`, {
      uuid: issue.uuid,
      state: IssueState.IN_PROGRESS,
    });
  };

  const submitRequest = async () => {
    try {
      await submitRequestFFA(
        issue.creator.publicKey,
        user.publicKey,
        issue.escrowContract,
        wallet,
        anchor,
        program
      );
      // If we are moved to the current submitter, then we should move out of the approved
      // submitter state. We can only move to completer, changes requested, or denied from here
      user.relations.push(ISSUE_ACCOUNT_RELATIONSHIP.CurrentSubmitter);
      const index = user.relations.indexOf(
        ISSUE_ACCOUNT_RELATIONSHIP.ApprovedSubmitter
      );

      if (index !== -1) {
        user.relations.splice(index, 1);
      }

      const index2 = user.relations.indexOf(
        ISSUE_ACCOUNT_RELATIONSHIP.ChangesRequestedSubmitter
      );

      if (index2 !== -1) {
        user.relations.splice(index2, 1);
      }

      axios.put(
        `${getApiEndpoint()}${DATA_API_ROUTE}/${ACCOUNT_ISSUE_API_ROUTE}`,
        {
          issueId: issue.uuid,
          accountId: user.uuid,
          relations: user.relations,
        }
      );
      axios.put(
        `${getApiEndpoint()}${DATA_API_ROUTE}/${ISSUE_API_ROUTE}/state`,
        {
          uuid: issue.uuid,
          state: IssueState.AWAITING_REVIEW,
        }
      );
      setIssue({
        ...issue,
        state: IssueState.AWAITING_REVIEW,
      });
      setIssueLoadingState("getting_contract");
    } catch (e) {
      console.error(e);
    }
  };

  const approveSubmission = async () => {
    try {
      await approveRequestFFA(
        issue.creator.publicKey,
        issue.currentSubmitter.publicKey,
        issue.escrowContract,
        wallet,
        anchor,
        program
      );
      await axios.post(
        `${getApiEndpoint()}${DATA_API_ROUTE}/${MERGE_PULL_REQUEST_API_ROUTE}`,
        {
          uuid: issue.uuid,
          githubId: user.githubId,
        }
      );
      // move the submitter to the completer
      issue.currentSubmitter.relations.push(
        ISSUE_ACCOUNT_RELATIONSHIP.Completer
      );
      const index = issue.currentSubmitter.relations.indexOf(
        ISSUE_ACCOUNT_RELATIONSHIP.CurrentSubmitter
      );

      if (index !== -1) {
        issue.currentSubmitter.relations.splice(index, 1);
      }
      axios.put(
        `${getApiEndpoint()}${DATA_API_ROUTE}/${ACCOUNT_ISSUE_API_ROUTE}`,
        {
          issueId: issue.uuid,
          accountId: issue.currentSubmitter.uuid,
          relations: issue.currentSubmitter.relations,
        }
      );
      setIssue({
        ...issue,
        state: IssueState.COMPLETE,
        currentSubmitter: null,
        completer: issue.currentSubmitter,
      });
      setIssueLoadingState("getting_contract");
    } catch (e) {
      console.error(e);
    }
  };

  const requestChangesSubmission = async () => {
    try {
      await denyRequestFFA(
        issue.creator.publicKey,
        issue.currentSubmitter.publicKey,
        issue.escrowContract,
        wallet,
        anchor,
        program
      );
      // Deny the request on chain, but save that the user made a request.
      // Being denied by the contract does not block further submissions, just
      // free up other submitters to submit while changes are being made
      issue.currentSubmitter.relations.push(
        ISSUE_ACCOUNT_RELATIONSHIP.ChangesRequestedSubmitter
      );
      const index = issue.currentSubmitter.relations.indexOf(
        ISSUE_ACCOUNT_RELATIONSHIP.CurrentSubmitter
      );

      if (index !== -1) {
        issue.currentSubmitter.relations.splice(index, 1);
      }
      axios.put(
        `${getApiEndpoint()}${DATA_API_ROUTE}/${ACCOUNT_ISSUE_API_ROUTE}`,
        {
          issueId: issue.uuid,
          accountId: issue.currentSubmitter.uuid,
          relations: issue.currentSubmitter.relations,
        }
      );
      axios.put(
        `${getApiEndpoint()}${DATA_API_ROUTE}/${ISSUE_API_ROUTE}/state`,
        {
          uuid: issue.uuid,
          state: IssueState.IN_PROGRESS,
        }
      );
      setIssue({
        ...issue,
        state: IssueState.IN_PROGRESS,
        currentSubmitter: null,
        changesRequestedSubmitters: [issue.currentSubmitter],
      });
      setIssueLoadingState("getting_contract");
    } catch (e) {
      console.error(e);
    }
  };

  const denySubmission = async () => {
    try {
      await denyRequestFFA(
        issue.creator.publicKey,
        issue.currentSubmitter.publicKey,
        issue.escrowContract,
        wallet,
        anchor,
        program
      );
      // Deny the submission on chain, and prevent the submitter from making
      // any more requests
      issue.currentSubmitter.relations.push(
        ISSUE_ACCOUNT_RELATIONSHIP.DeniedSubmitter
      );
      const index = issue.currentSubmitter.relations.indexOf(
        ISSUE_ACCOUNT_RELATIONSHIP.CurrentSubmitter
      );

      if (index !== -1) {
        issue.currentSubmitter.relations.splice(index, 1);
      }
      axios.put(
        `${getApiEndpoint()}${DATA_API_ROUTE}/${ACCOUNT_ISSUE_API_ROUTE}`,
        {
          issueId: issue.uuid,
          accountId: issue.currentSubmitter.uuid,
          relations: issue.currentSubmitter.relations,
        }
      );
      axios.put(
        `${getApiEndpoint()}${DATA_API_ROUTE}/${ISSUE_API_ROUTE}/state`,
        {
          uuid: issue.uuid,
          state: IssueState.IN_PROGRESS,
        }
      );

      setIssue({
        ...issue,
        state: IssueState.IN_PROGRESS,
        currentSubmitter: null,
        deniedSubmitters: [issue.currentSubmitter],
      });
      setIssueLoadingState("getting_contract");
    } catch (e) {
      console.error(e);
    }
  };

  const cancelEscrow = async () => {
    await cancelFFA(
      issue.creator.publicKey,
      issue.escrowContract,
      wallet,
      anchor,
      program
    );

    axios.put(`${getApiEndpoint()}${DATA_API_ROUTE}/${ISSUE_API_ROUTE}/state`, {
      uuid: issue.uuid,
      state: IssueState.CANCELED,
    });
    setIssue({
      ...issue,
      state: IssueState.CANCELED,
    });
  };

  const handleVote = async () => {
    try {
      if (user.isCreator) {
        // If we are the creator, vote to cancel as creator
        await voteToCancelFFA(
          issue.creator.publicKey,
          issue.creator.publicKey,
          issue.escrowContract,
          wallet,
          anchor,
          program
        );
      } else if (user.isCurrentSubmitter) {
        // If we are the submitter, vote to cancel as submitter
        await voteToCancelFFA(
          issue.creator.publicKey,
          user.publicKey,
          issue.escrowContract,
          wallet,
          anchor,
          program
        );
      }
      // If we are neither (request submitted or denied), then we still need
      // to vote to cancel, but this information is store off-chain (for now).
      user.relations.push(ISSUE_ACCOUNT_RELATIONSHIP.VotingCancel);
      setUser({
        ...user,
        relations: user.relations,
        isVotingCancel: true,
      });
      const index = issue.needsToVote.findIndex(
        (voter) => voter.uuid === user.uuid
      );

      if (index !== -1) {
        issue.needsToVote.splice(index, 1);
      }
      axios.put(
        `${getApiEndpoint()}${DATA_API_ROUTE}/${ACCOUNT_ISSUE_API_ROUTE}`,
        {
          issueId: issue.uuid,
          accountId: user.uuid,
          relations: user.relations,
        }
      );
      setIssue({
        ...issue,
        needsToVote: issue.needsToVote,
        cancelVoters: [...issue.cancelVoters, user as Contributor],
      });
      setIssueLoadingState("getting_contract");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bounty-buttons">
      <>
        {user.relations.length === 0 && (
          <button
            className={classNames("button-primary")}
            onClick={() => {
              requestToSubmit();
            }}
          >
            Apply
          </button>
        )}
        {user.isCreator &&
          (user.isVotingCancel
            ? user.relations.length === 2
            : user.relations.length === 1) && (
            <button
              className={classNames("button-primary")}
              onClick={() => {
                requestToSubmit();
              }}
            >
              Allow Self Submission
            </button>
          )}
        {user.isRequestedSubmitter && (
          <button className={classNames("button-primary disabled")}>
            Request Pending
          </button>
        )}
        {user.isDeniedRequester && (
          <button className={classNames("button-primary disabled")}>
            Submission Request Denied
          </button>
        )}
        {user.isApprovedSubmitter && !issue.currentSubmitter && (
          <div
            className="hover-tooltip-wrapper"
            onMouseEnter={() => {
              setHoveredButton("submit");
            }}
            onMouseLeave={() => {
              setHoveredButton("none");
            }}
          >
            <button
              className={classNames("button-primary", {
                disabled: !issue.pullNumber,
              })}
              onClick={() => {
                submitRequest();
              }}
            >
              Submit
            </button>
            {hoveredButton === "submit" && !issue.pullNumber && (
              <div className="hover-tooltip">
                Please open a PR closing this issue before submitting
              </div>
            )}
          </div>
        )}
        {user.isCurrentSubmitter && !user.isCreator && (
          <button className={classNames("button-primary disabled")}>
            Submission Pending Review
          </button>
        )}
        {user.isDeniedSubmitter && (
          <button className={classNames("button-primary disabled")}>
            Submission Denied
          </button>
        )}
        {user.isChangesRequestedSubmitter && (
          <button
            className={classNames("button-primary")}
            onClick={() => {
              submitRequest();
            }}
          >
            Re-Submit
          </button>
        )}
        {user.isCreator && issue.currentSubmitter && (
          <button
            className={classNames("button-primary")}
            onClick={() => {
              approveSubmission();
            }}
          >
            Approve
          </button>
        )}
        {user.isCreator && issue.currentSubmitter && (
          <button
            className={classNames("button-primary")}
            onClick={() => {
              requestChangesSubmission();
            }}
          >
            Request Changes
          </button>
        )}
        {user.isCreator && issue.currentSubmitter && (
          <button
            className={classNames("button-primary")}
            onClick={() => {
              denySubmission();
            }}
          >
            Deny
          </button>
        )}
        {(user.isCreator ||
          user.isCurrentSubmitter ||
          user.isDeniedSubmitter ||
          user.isChangesRequestedSubmitter ||
          user.isVotingCancel) && (
          <button
            className={classNames("button-primary", {
              disabled: user.isVotingCancel,
            })}
            onClick={() => {
              handleVote();
            }}
          >
            {`${user.isVotingCancel ? "Voted To Cancel" : "Vote To Cancel"}`}
          </button>
        )}
        {user.isCreator && issue.needsToVote.length === 0 && (
          <button
            className={classNames("button-primary")}
            onClick={() => {
              cancelEscrow();
            }}
          >
            Cancel Bounty
          </button>
        )}
      </>
    </div>
  );
};
