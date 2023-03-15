import USDC from "../../assets/USDC";
import { Clock } from "react-feather";
import { marked } from "marked";
import { Issue } from "@/src/types";
import { useLocation } from "react-router-dom";
import Logo from "@/src/assets/Logo";

export const LancerBounty = ({ issue }: { issue: Issue }) => {
  const search = useLocation().search;

  const params = new URLSearchParams(search);
  const jwt = params.get("token");
  const previewMarkup = () => {
    if (!issue.description) return { __html: "<div/>" };

    const markdown = marked.parse(issue.description, { breaks: true });
    return { __html: markdown };
  };
  return (
    <div
      id="w-node-cff91d78-63a9-e923-e5c8-4e09d47abde6-06e9cdab"
      data-w-id="cff91d78-63a9-e923-e5c8-4e09d47abde6"
      role="listitem"
      className="companies-card"
    >
      <a
        href={`/bounty?id=${issue.uuid}${jwt ? `&token=${jwt}` : ""}`}
        className="company-card-link-wrapper w-inline-block"
      >
        <div className="bounty-card-content">
          <div className="w-row">
            <h2 className="heading no-padding-margin">{issue.title}</h2>
          </div>
          <div className="container-3">
            <div
              className="bounty-markdown-preview"
              dangerouslySetInnerHTML={previewMarkup()}
            />
          </div>
          <div className="spacer-filled" />
          <div className="bounty-footer">
            <div className="estimated-time-wrapper">
              <Clock size={"36px"} color="#14bb88" />
              <div>{`${issue.estimatedTime} HRS`}</div>
            </div>
            <div className="tag-list">
              {issue.tags.map((tag) => (
                <div className="tag-item" key={tag}>
                  {tag}
                </div>
              ))}
            </div>
          </div>
          <div className="spacer" />

          <div className="bounty-footer">
            <div className="bounty-card-funder">
              <div className="contributor-picture">
                <Logo width="auto" height="36px" />
              </div>

              <div className="bounty-funder-text">
                <h3 className="no-padding-margin">{issue.org}</h3>
                <div>{issue.repo}</div>
              </div>
            </div>
            <div className="bounty-funding">
              <h3 className="no-padding-margin">{issue.amount.toFixed(2)}</h3>
              <USDC width="36px" height="36px" />
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};
