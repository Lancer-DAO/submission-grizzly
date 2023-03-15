import * as ReactDOM from "react-dom/client";
import { ExistingIssueFunds } from "../components/existingIssueFunds";
import axios, { AxiosResponse } from "axios";
import {
  DATA_API_ROUTE,
  FULL_PULL_REQUEST_API_ROUTE,
  ISSUE_API_ROUTE,
} from "@/server/src/constants";
import { getApiEndpointExtension } from "../utils";
import { Issue, IssueState } from "../types";
const WRAPPER_CLASSNAME = "discussion-sidebar-item js-discussion-sidebar-item";
const assigneeSelector =
  ".discussion-sidebar-item.sidebar-assignee.js-discussion-sidebar-item";
const linkedPRSelector = ".Link--primary.f4.text-bold.markdown-title";
const innerPRSpanSelector = ".color-fg-muted.text-normal";
const authorSelector = ".author.Link--primary.text-bold";

const getPR = (splitURL, pullNumber, author) =>
  axios.get(
    `${getApiEndpointExtension()}${DATA_API_ROUTE}/${FULL_PULL_REQUEST_API_ROUTE}`,
    {
      params: {
        org: splitURL[3],
        repo: splitURL[4],
        pullNumber: pullNumber,
        issueNumber: splitURL[6],
        githubLogin: author,
      },
    }
  );

// Insert our component into the right side of the issue page after getting the issue info
export const insertIssue = (response) => {
  const assigneeEle = window.document.querySelectorAll(assigneeSelector)[0];
  const rawIssue = response.data;

  const issue: Issue = {
    ...rawIssue,
    amount: parseFloat(rawIssue.funding_amount),
    mint: rawIssue.funding_mint,
    pullNumber: rawIssue.pull_number,
  };
  if (assigneeEle && issue?.uuid && issue.state !== IssueState.NEW) {
    const fundingWrapper = window.document.createElement("div");
    fundingWrapper.className = WRAPPER_CLASSNAME;
    assigneeEle.insertAdjacentElement("afterend", fundingWrapper);
    const fundingInner = ReactDOM.createRoot(fundingWrapper);
    fundingInner.render(<ExistingIssueFunds issue={issue} />);
  }
};

// Check if there is a connected lancer issue, and if so, insert our widget on the right side
export const insertExistingIssue = (splitURL: string[]) => {
  const existingWrapper = window.document.querySelector(
    `.${WRAPPER_CLASSNAME}`
  );
  if (!existingWrapper) {
    const prNumberRawWrapper =
      window.document.querySelectorAll(linkedPRSelector)[0];
    if (prNumberRawWrapper) {
      const prNumberRaw = prNumberRawWrapper
        .querySelector(innerPRSpanSelector)
        .innerHTML.split("#")[1];
      const author = window.document.querySelector(authorSelector).innerHTML;

      getPR(splitURL, parseInt(prNumberRaw), author).then((resp) => {
        insertIssue(resp);
      });
    } else {
      axios
        .get(
          `${getApiEndpointExtension()}${DATA_API_ROUTE}/${ISSUE_API_ROUTE}`,
          {
            params: {
              org: splitURL[3],
              repo: splitURL[4],
              issueNumber: splitURL[6],
            },
          }
        )
        .then((response: AxiosResponse<any, any>) => {
          insertIssue(response);
        });
    }
  }
};
