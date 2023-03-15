import {
  ACCOUNT_ISSUE_API_ROUTE,
  DATA_API_ROUTE,
} from "@/server/src/constants";
import { getApiEndpoint } from "@/src/utils";
import axios from "axios";
import { useLancer } from "@/src/providers/lancerProvider";
import { Contributor, ISSUE_ACCOUNT_RELATIONSHIP } from "@/src/types";
import { addSubmitterFFA, removeSubmitterFFA } from "@/src/onChain";
import { ContributorInfo } from "@/src/components/ContributorInfo";
import { Check, X } from "react-feather";

export type SubmitterSectionType = "approved" | "requested";
interface SubmitterSectionProps {
  submitter: Contributor;
  type: SubmitterSectionType;
}

const SubmitterSection: React.FC<SubmitterSectionProps> = ({
  submitter,
  type,
}: SubmitterSectionProps) => {
  const { issue, wallet, anchor, program, user, setIssue } = useLancer();
  if (!user.isCreator) {
    return (
      <div className="submitter-section">
        <ContributorInfo user={submitter} />
      </div>
    );
  }

  const handleSubmitter = async (cancel?: boolean) => {
    switch (type) {
      case "approved":
        {
          try {
            await removeSubmitterFFA(
              issue.creator.publicKey,
              submitter.publicKey,
              issue.escrowContract,
              wallet,
              anchor,
              program
            );
            submitter.relations.push(
              ISSUE_ACCOUNT_RELATIONSHIP.RequestedSubmitter
            );
            const index = user.relations.indexOf(
              ISSUE_ACCOUNT_RELATIONSHIP.ApprovedSubmitter
            );

            if (index !== -1) {
              user.relations.splice(index, 1);
            }
            axios.put(
              `${getApiEndpoint()}${DATA_API_ROUTE}/${ACCOUNT_ISSUE_API_ROUTE}`,
              {
                issueId: issue.uuid,
                accountId: submitter.uuid,
                relations: [ISSUE_ACCOUNT_RELATIONSHIP.RequestedSubmitter],
              }
            );
          } catch (e) {
            console.error(e);
          }
        }
        break;
      case "requested":
        {
          try {
            if (cancel) {
              axios.put(
                `${getApiEndpoint()}${DATA_API_ROUTE}/${ACCOUNT_ISSUE_API_ROUTE}`,
                {
                  issueId: issue.uuid,
                  accountId: submitter.uuid,
                  relations: [ISSUE_ACCOUNT_RELATIONSHIP.DeniedRequester],
                }
              );
              const index = issue.requestedSubmitters.findIndex(
                (_submitter) => submitter.uuid === _submitter.uuid
              );

              if (index !== -1) {
                issue.requestedSubmitters.splice(index, 1);
              }
              setIssue({
                ...issue,
                deniedRequesters: [...issue.deniedRequesters, submitter],
              });
            } else {
              await addSubmitterFFA(
                issue.creator.publicKey,
                submitter.publicKey,
                issue.escrowContract,
                wallet,
                anchor,
                program
              );
              axios.put(
                `${getApiEndpoint()}${DATA_API_ROUTE}/${ACCOUNT_ISSUE_API_ROUTE}`,
                {
                  issueId: issue.uuid,
                  accountId: submitter.uuid,
                  relations: [ISSUE_ACCOUNT_RELATIONSHIP.ApprovedSubmitter],
                }
              );
              const index = issue.requestedSubmitters.findIndex(
                (_submitter) => submitter.uuid === _submitter.uuid
              );

              if (index !== -1) {
                issue.requestedSubmitters.splice(index, 1);
              }
              setIssue({
                ...issue,
                approvedSubmitters: [...issue.approvedSubmitters, submitter],
              });
            }
          } catch (e) {
            console.error(e);
          }
        }
        break;
    }
  };

  return (
    <div className="submitter-section">
      <ContributorInfo user={submitter} />

      {type === "approved" ? (
        <div className="empty-submitter-cell"></div>
      ) : (
        <button onClick={() => handleSubmitter()}>
          <Check color="#1488bb" width="20px" height="20px" />
        </button>
      )}
      <button onClick={() => handleSubmitter()}>
        <X color="red" width="20px" height="20px" />
      </button>
    </div>
  );
};

export default SubmitterSection;
