import { Issue } from "../types";
import { getAppEndpointExtension, getMintName } from "../utils";

export const ExistingIssueFunds = ({ issue }: { issue: Issue }) => {
  return (
    <>
      <div className="text-bold discussion-sidebar-heading discussion-sidebar-toggle hx_rsm-trigger">
        This Issue Was Funded Through Lancer
      </div>
      <p>Bounty: ${`${issue.amount.toFixed(2)} ${getMintName(issue.mint)}`}</p>
      {issue.pullNumber && <p>There is a submission pending for this bounty</p>}
      <a
        href={`${getAppEndpointExtension()}/bounty?id=${issue.uuid}`}
        target="_blank"
        rel="noreferrer"
      >
        View more details on Lancer
      </a>
    </>
  );
};
