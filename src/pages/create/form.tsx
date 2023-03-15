import { useEffect, useState } from "react";
import { marked } from "marked";
import { convertToQueryParams, getApiEndpoint } from "@/src/utils";
import axios from "axios";
import {
  ACCOUNT_API_ROUTE,
  DATA_API_ROUTE,
  GITHUB_ISSUE_API_ROUTE,
  ISSUE_API_ROUTE,
} from "@/server/src/constants";
import { createFFA } from "@/src/onChain";
import { useLancer } from "@/src/providers/lancerProvider";
import classnames from "classnames";
import { useLocation } from "react-router-dom";
import { LoadingBar } from "@/src/components/LoadingBar";

const Form = () => {
  const { user, program, anchor, wallet, setUser } = useLancer();

  const search = useLocation().search;

  const params = new URLSearchParams(search);
  const jwt = params.get("token");
  const [creationType, setCreationType] = useState<"new" | "existing">("new");
  const [issues, setIssues] = useState<any[]>();
  const [repo, setRepo] = useState<any>();
  const [issue, setIssue] = useState<any>();
  const [formData, setFormData] = useState({
    organizationName: "",
    repositoryName: "",
    issueTitle: "",
    issueDescription: "",
    requirements: [],
    estimatedTime: "",
    isPrivate: false,
  });
  const [isOpenRepo, setIsOpenRepo] = useState(false);
  const [isOpenIssue, setIsOpenIssue] = useState(false);

  const [isPreview, setIsPreview] = useState(false);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  const toggleOpenRepo = () => setIsOpenRepo(!isOpenRepo);
  const toggleOpenIssue = () => setIsOpenIssue(!isOpenIssue);
  const togglePreview = () => setIsPreview(!isPreview);

  useEffect(() => {
    if (user?.githubId) {
      axios
        .get(
          `${getApiEndpoint()}${DATA_API_ROUTE}/${ACCOUNT_API_ROUTE}/organizations?${convertToQueryParams(
            { githubId: user.githubId }
          )}`
        )
        .then((resp) => {
          console.log(resp);
          setUser({
            ...user,
            repos: resp.data.data,
          });
        });
    }
  }, [user?.githubId]);

  useEffect(() => {
    if (user?.githubId && repo) {
      // once we choose a repo, get all the issues for that repo
      // that are not linked to a lancer bounty. The user can choose
      // to link a bounty to one of these issues
      axios
        .get(
          `${getApiEndpoint()}${DATA_API_ROUTE}/${ACCOUNT_API_ROUTE}/organization/repository_issues`,
          {
            params: {
              githubId: user.githubId,
              org: repo.full_name.split("/")[0],
              repo: repo.full_name.split("/")[1],
            },
          }
        )
        .then((resp) => {
          console.log(resp);
          setIssues(resp.data.data);
        });
    }
  }, [repo]);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleChangeRepo = (repoFullName: string) => {
    const repo = user.repos.find((_repo) => _repo.full_name === repoFullName);
    setRepo(repo);
  };

  const handleChangeIssue = (issueNumber: number) => {
    const issue = issues.find((_issue) => _issue.number === issueNumber);
    setIssue(issue);
  };

  const handleCheckboxChange = (event) => {
    setFormData({
      ...formData,
      isPrivate: !formData.isPrivate,
    });
  };

  const handleRequirementsChange = (event) => {
    const requirements = event.target.value.split(",");
    setFormData({
      ...formData,
      requirements,
    });
  };

  const handleDescriptionChange = (event) => {
    setFormData({
      ...formData,
      issueDescription: event.target.value,
    });
  };

  const previewMarkup = () => {
    const markdown = marked.parse(formData.issueDescription, { breaks: true });
    return { __html: markdown };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingIssue(true);
    // Create a new github issue
    const createIssueNew = async () => {
      return axios.post(
        `${getApiEndpoint()}${DATA_API_ROUTE}/${GITHUB_ISSUE_API_ROUTE}`,
        {
          createNewIssue: true,
          githubId: user.githubId,
          githubLogin: user.githubLogin,
          solanaKey: user.publicKey.toString(),
          org: repo ? repo.full_name.split("/")[0] : "Lancer-DAO",
          repo: repo ? repo.full_name.split("/")[1] : "github-app",
          title: formData.issueTitle,
          description: formData.issueDescription,
          tags: formData.requirements,
          private: formData.isPrivate || repo ? repo.private : false,
          estimatedTime: formData.estimatedTime,
        }
      );
    };

    // link an existing github issue
    const createIssueExisting = async () => {
      return axios.post(
        `${getApiEndpoint()}${DATA_API_ROUTE}/${GITHUB_ISSUE_API_ROUTE}`,
        {
          createNewIssue: false,
          githubId: user.githubId,
          githubLogin: user.githubLogin,
          solanaKey: user.publicKey.toString(),
          org: repo ? repo.full_name.split("/")[0] : "Lancer-DAO",
          repo: repo ? repo.full_name.split("/")[1] : "github-app",
          title: issue.title,
          description: issue.body,
          tags: formData.requirements,
          private: repo.private,
          estimatedTime: formData.estimatedTime,
          issueNumber: issue.number,
        }
      );
    };

    // create and link an escrow contract to the issue
    const createAndFundEscrow = async (issue: {
      number: number;
      uuid: string;
    }) => {
      console.log("submit");
      const creator = user.publicKey;
      const timestamp = await createFFA(creator, wallet, anchor, program);
      await axios.put(
        `${getApiEndpoint()}${DATA_API_ROUTE}/${ISSUE_API_ROUTE}/timestamp`,
        {
          org: repo ? repo.full_name.split("/")[0] : "Lancer-DAO",
          repo: repo ? repo.full_name.split("/")[1] : "github-app",
          issueNumber: issue.number,
          timestamp: timestamp,
        }
      );
      window.location.replace(`/fund?id=${issue.uuid}&token=${jwt}`);
    };
    if (creationType === "new") {
      const issueResponse = await createIssueNew();
      console.log("issueres", issueResponse);
      await createAndFundEscrow(issueResponse.data.issue);
    } else {
      const issueResponse = await createIssueExisting();
      console.log("issueres", issueResponse);
      await createAndFundEscrow(issueResponse.data.issue);
    }
  };

  return (
    <div className="form-container">
      <form className="form" onSubmit={handleSubmit}>
        <>
          <div id="job-information" className="form-layout-flex">
            <h2
              id="w-node-a3d1ad77-e5aa-114b-bcd7-cde3db1bb746-0ae9cdc2"
              className="form-subtitle"
            >
              New Lancer Bounty
            </h2>

            <label>
              Project<span className="color-red">*</span>
            </label>
            <div
              id="w-node-_11ff66e2-bb63-3205-39c9-a48a569518d9-0ae9cdc2"
              className="input-container-full-width"
            >
              {!user?.repos ? (
                <LoadingBar title="Loading Repositories" />
              ) : (
                <div
                  data-delay="0"
                  data-hover="false"
                  id="w-node-b1521c3c-4fa1-4011-ae36-88dcb6e746fb-0ae9cdc2"
                  className="w-dropdown"
                  onClick={toggleOpenRepo}
                >
                  <main className="dropdown-toggle-2 w-dropdown-toggle">
                    <div className="w-icon-dropdown-toggle"></div>
                    <div>
                      {repo ? (
                        repo.full_name
                      ) : (
                        <div>
                          Select Project <span className="color-red">* </span>
                        </div>
                      )}
                    </div>
                  </main>
                  {isOpenRepo && user?.repos && (
                    <div
                      className="w-dropdown-list"
                      onMouseLeave={() => setIsOpenRepo(false)}
                    >
                      {user.repos.map((project) => (
                        <div
                          onClick={() => handleChangeRepo(project.full_name)}
                          key={project.full_name}
                          className="w-dropdown-link"
                        >
                          {project.full_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {repo && (
              <div className="issue-creation-type">
                <div
                  className={classnames("form-subtitle hover-effect", {
                    unselected: creationType !== "new",
                  })}
                  onClick={() => setCreationType("new")}
                >
                  Create a New GitHub Issue
                </div>
                <div>OR</div>
                <div
                  className={classnames("form-subtitle hover-effect", {
                    unselected: creationType !== "existing",
                  })}
                  onClick={() => setCreationType("existing")}
                >
                  Link an Existing GitHub Issue
                </div>
              </div>
            )}
            {repo && creationType === "new" && (
              <>
                <div>
                  <label>
                    Issue Title<span className="color-red">*</span>
                  </label>
                  <input
                    type="text"
                    className="input w-input"
                    name="issueTitle"
                    placeholder="Ex. Add New Feature "
                    id="Issue"
                    value={formData.issueTitle}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="field-label-2">
                    Est. Time to Completion<span className="color-red">*</span>
                  </label>
                  <input
                    type="number"
                    className="input w-input"
                    name="estimatedTime"
                    value={formData.estimatedTime}
                    onChange={handleChange}
                    placeholder="Ex. 3 (hours)"
                    id="Issue-Description"
                  />
                </div>
                <div>
                  <label className="field-label">
                    Coding Languages<span className="color-red">* </span>
                  </label>
                  <input
                    type="text"
                    className="input w-input"
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleRequirementsChange}
                    placeholder="list seperated by commas"
                    id="Job-Location-2"
                  />
                </div>
                <div
                  id="w-node-_19e3179a-ebf7-e568-5dcf-3c0e607846d8-0ae9cdc2"
                  className="input-container-full-width"
                >
                  <div className="description-label">
                    <label>
                      Description<span className="color-red">*</span>
                    </label>
                    <button
                      className="button-primary hug no-box-shadow"
                      onClick={(e) => {
                        e.preventDefault();
                        togglePreview();
                      }}
                    >
                      {isPreview ? "Edit" : "Preview"}
                    </button>
                  </div>
                  {isPreview ? (
                    <div
                      className="markdown-preview"
                      dangerouslySetInnerHTML={previewMarkup()}
                    />
                  ) : (
                    <textarea
                      id="Job-Description"
                      name="issueDescription"
                      value={formData.issueDescription}
                      onChange={handleDescriptionChange}
                      placeholder="Provide a step by step breakdown of what is needed to complete the task. Include criteria that will determine success. **Markdown Supported** "
                      className="textarea w-input"
                    />
                  )}
                </div>
                <div className="required-helper">
                  <span className="color-red">* </span> Required
                </div>
                <label className="w-checkbox checkbox-field-2">
                  <div
                    className={classnames(
                      "w-checkbox-input w-checkbox-input--inputType-custom checkbox",
                      {
                        checked:
                          formData.isPrivate || repo ? repo.private : false,
                        disabled: repo ? repo.private : false,
                      }
                    )}
                    onChange={handleCheckboxChange}
                  />

                  <label className="check-label">
                    Is this a Private Issue?
                  </label>
                  <p className="check-paragraph">
                    Only GitHub collaborators will have access to see this.
                  </p>
                </label>

                {isSubmittingIssue ? (
                  <LoadingBar title="Creating Lancer Bounty" />
                ) : (
                  <input
                    type="submit"
                    value="Submit"
                    data-wait="Please wait..."
                    id="w-node-ab1d78c4-cf4d-d38a-1a64-ef9c503727ac-0ae9cdc2"
                    className={classnames("button-primary issue-submit", {
                      disabled:
                        !repo ||
                        !formData.issueTitle ||
                        !formData.estimatedTime ||
                        !formData.requirements ||
                        !formData.issueDescription ||
                        formData.requirements?.length === 0,
                    })}
                  />
                )}
              </>
            )}
            {repo && creationType === "existing" && (
              <>
                <label>
                  Issue<span className="color-red">*</span>
                </label>
                <div
                  id="w-node-_11ff66e2-bb63-3205-39c9-a48a569518d9-0ae9cdc2"
                  className="input-container-full-width"
                >
                  <div
                    data-delay="0"
                    data-hover="false"
                    id="w-node-b1521c3c-4fa1-4011-ae36-88dcb6e746fb-0ae9cdc2"
                    className="w-dropdown"
                    onClick={toggleOpenIssue}
                  >
                    <main className="dropdown-toggle-2 w-dropdown-toggle">
                      <div className="w-icon-dropdown-toggle"></div>
                      <div>
                        {issues ? (
                          issue ? (
                            `#${issue.number}: ${issue.title}`
                          ) : (
                            <div>
                              Select Issue <span className="color-red">* </span>
                            </div>
                          )
                        ) : (
                          "Loading Issues"
                        )}
                      </div>
                    </main>
                    {isOpenIssue && issues && (
                      <div
                        className="w-dropdown-list"
                        onMouseLeave={() => setIsOpenRepo(false)}
                      >
                        {issues.map((issue) => (
                          <div
                            onClick={() => handleChangeIssue(issue.number)}
                            key={issue.number}
                            className="w-dropdown-link"
                          >
                            {`#${issue.number}: ${issue.title}`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="field-label-2">
                    Est. Time to Completion<span className="color-red">*</span>
                  </label>
                  <input
                    type="number"
                    className="input w-input"
                    name="estimatedTime"
                    value={formData.estimatedTime}
                    onChange={handleChange}
                    placeholder="Ex. 3 (hours)"
                    id="Issue-Description"
                  />
                </div>
                <div>
                  <label className="field-label">
                    Coding Languages<span className="color-red">* </span>
                  </label>
                  <input
                    type="text"
                    className="input w-input"
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleRequirementsChange}
                    placeholder="list seperated by commas"
                    id="Job-Location-2"
                  />
                </div>
                {isSubmittingIssue ? (
                  <LoadingBar title="Creating Lancer Bounty" />
                ) : (
                  <input
                    type="submit"
                    value="Submit"
                    data-wait="Please wait..."
                    id="w-node-ab1d78c4-cf4d-d38a-1a64-ef9c503727ac-0ae9cdc2"
                    className={classnames("button-primary issue-submit", {
                      disabled:
                        !issue ||
                        !formData.estimatedTime ||
                        !formData.requirements,
                    })}
                  />
                )}
              </>
            )}
          </div>
        </>
      </form>
    </div>
  );
};

export default Form;
