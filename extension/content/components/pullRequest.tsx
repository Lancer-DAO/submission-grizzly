import { Issue } from "../types";
import { getAppEndpointExtension } from "../utils";

export const PullRequest = ({ issue }: { issue: Issue }) => {
  return (
    <>
      <div className="text-bold discussion-sidebar-heading discussion-sidebar-toggle hx_rsm-trigger">
        This PR is linked to a Lancer Bounty
      </div>
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
