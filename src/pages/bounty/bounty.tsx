import { getSolscanAddress } from "@/src/utils";
import { IssueState } from "@/types";
import { marked } from "marked";
import { ReactNode, useEffect, useState } from "react";
import { useLancer } from "@/src/providers/lancerProvider";
import SubmitterSection from "@/src/pages/bounty/components/submitterSection";
import { Clock } from "react-feather";
import USDC from "@/src/assets/USDC";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { ContributorInfo } from "@/src/components/ContributorInfo";
import { BountyActions } from "@/src/pages/bounty/components/bountyActions";
import Logo from "@/src/assets/Logo";
dayjs.extend(localizedFormat);

const Bounty: React.FC = () => {
  const { user, issue, setForceGetIssue } = useLancer();
  const [pollId, setPollId] = useState(null);
  useEffect(() => {
    const setFuturePoll = () => {
      setForceGetIssue(true);
      setPollId(setTimeout(() => setFuturePoll(), 5000));
    };
    if (!pollId) {
      setPollId(setTimeout(() => setFuturePoll(), 5000));
    }
  }, []);

  if (!user || !issue) {
    return <></>;
  }
  const previewMarkup = () => {
    const markdown = marked.parse(issue.description, { breaks: true });
    return { __html: markdown };
  };

  return (
    <section className="section-job-post wf-section">
      <div className="container-default">
        <div className="w-layout-grid grid-job-post">
          <div
            id="w-node-_9d97a6aa-31d5-1276-53c2-e76c8908f874-fde9cdb1"
            data-w-id="9d97a6aa-31d5-1276-53c2-e76c8908f874"
            className="job-post-container"
          >
            <div
              id="w-node-_9d97a6aa-31d5-1276-53c2-e76c8908f876-fde9cdb1"
              className="job-post-primary-info"
            >
              <div className="contributor-picture-large">
                <Logo width="100px" height="100px" />
              </div>
              <div className="bounty-page-title-section">
                <div className="bounty-title-row-1">
                  <a
                    href={`https://github.com/${issue.org}`}
                    className="job-post-company-name"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {issue.org}
                  </a>
                  <div className={`issue-state ${issue.state} text-start`}>
                    {issue.state.split("_").join(" ")}
                  </div>
                </div>
                <a
                  className="job-post-title"
                  href={`https://github.com/${issue.org}/${issue.repo}/issues/${issue.issueNumber}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {issue.title}
                </a>
                <div className="bounty-title-row-1">
                  <div className="job-post-date">
                    {`${dayjs
                      .unix(parseInt(issue.timestamp) / 1000)
                      .format("MMMM D, YYYY h:mm A")}`}
                  </div>
                  {issue.escrowKey && (
                    <a
                      href={getSolscanAddress(issue.escrowKey)}
                      className="job-post-company-name"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Escrow Contract
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div></div>
            <div className="job-post-middle">
              <div className="job-post-info-container">
                <Clock />
                <div className="job-post-info-text icon-left">
                  {`${issue.estimatedTime}`} HOURS
                </div>
              </div>
              <div className="job-post-info-divider"></div>
              <div className="job-post-info-container">
                <div className="tag-list">
                  {issue.tags.map((tag) => (
                    <div className="tag-item" key={tag}>
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
              <div className="job-post-info-divider"></div>
              <div className="job-post-info-container">
                <div className="job-post-info-text icon-right">
                  {issue.amount.toFixed(2)}
                </div>
                <USDC height="24px" width="24px" />
              </div>
            </div>
            <div className="job-post-bottom">
              <h2 className="job-post-subtitle">Job description</h2>
              <div
                className="bounty-markdown-preview"
                dangerouslySetInnerHTML={previewMarkup()}
              />
              {<BountyActions />}
            </div>
          </div>
          <div
            id="w-node-_272b1d4e-bae1-2928-a444-208d5db4485b-fde9cdb1"
            className="w-form"
          >
            <div className="contributors-section">
              <h2>Links</h2>
              {issue.issueNumber && (
                <a
                  href={`https://github.com/${issue.org}/${issue.repo}/issues/${issue.issueNumber}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub Issue
                </a>
              )}
              {issue.pullNumber && (
                <a
                  href={`https://github.com/${issue.org}/${issue.repo}/issues/${issue.pullNumber}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub Pull Request
                </a>
              )}
            </div>
            <div className="contributors-section">
              <h2>Contributors</h2>
              {issue?.creator && (
                <div>
                  <label className="field-label-10">Creator</label>
                  <ContributorInfo user={issue.creator} />
                </div>
              )}
              {user.isCreator && issue.deniedRequesters.length > 0 && (
                <div>
                  <label className="field-label-5">Denied Requesters</label>
                  {issue.deniedRequesters.map((submitter) => (
                    <ContributorInfo user={submitter} key={submitter.uuid} />
                  ))}
                </div>
              )}
              {user.isCreator && issue.requestedSubmitters.length > 0 && (
                <div>
                  <label className="field-label-5">Requested Applicants</label>
                  {issue.requestedSubmitters.map((submitter) => (
                    <SubmitterSection
                      submitter={submitter}
                      type="requested"
                      key={`requested-submitters-${submitter.uuid}`}
                    />
                  ))}
                </div>
              )}

              {user.isCreator && issue.approvedSubmitters.length > 0 && (
                <div>
                  <label className="field-label-5">Approved Applicants</label>
                  {issue.approvedSubmitters.map((submitter) => (
                    <SubmitterSection
                      submitter={submitter}
                      type="approved"
                      key={`approved-submitters-${submitter.uuid}`}
                    />
                  ))}
                </div>
              )}
              {issue.state === IssueState.AWAITING_REVIEW && (
                <div>
                  <label className="field-label-10">Submissions</label>
                  <ContributorInfo user={issue.currentSubmitter} />
                </div>
              )}
              {user.isCreator &&
                issue.changesRequestedSubmitters.length > 0 && (
                  <div>
                    <label className="field-label-5">Changes Requested</label>
                    {issue.changesRequestedSubmitters.map((submitter) => (
                      <ContributorInfo user={submitter} key={submitter.uuid} />
                    ))}
                  </div>
                )}
              {user.isCreator && issue.deniedSubmitters.length > 0 && (
                <div>
                  <label className="field-label-5">Denied Submitters</label>
                  {issue.deniedSubmitters.map((submitter) => (
                    <ContributorInfo user={submitter} key={submitter.uuid} />
                  ))}
                </div>
              )}
              {issue.completer && (
                <div>
                  <label className="field-label-10">Bounty Completer</label>
                  <ContributorInfo user={issue.completer} />
                </div>
              )}
              {user.isCreator && issue.cancelVoters.length > 0 && (
                <div>
                  <label className="field-label-5">Voting To Cancel</label>
                  {issue.cancelVoters.map((submitter) => (
                    <ContributorInfo user={submitter} key={submitter.uuid} />
                  ))}
                </div>
              )}
              {user.isCreator && issue.needsToVote.length > 0 && (
                <div>
                  <label className="field-label-5">
                    Votes Needed to Cancel
                  </label>
                  {issue.needsToVote.map((submitter) => (
                    <ContributorInfo user={submitter} key={submitter.uuid} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Bounty;
