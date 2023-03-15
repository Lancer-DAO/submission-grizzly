import { useState } from "react";

import { IssueState } from "@/src/types";
import { useLancer } from "@/src/providers/lancerProvider";
import classnames from "classnames";
import FundBounty from "./fundBounty";
import { LoadingBar } from "@/src/components/LoadingBar";

const Form = () => {
  const { issue } = useLancer();
  const [formData, setFormData] = useState({
    fundingAmount: null,
  });
  const [fundingType, setFundingType] = useState<"card" | "wallet">("card");
  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  return (
    issue && (
      <div className="form-container">
        <div className="form">
          <>
            <div id="job-information" className="form-layout-flex">
              <h2
                id="w-node-a3d1ad77-e5aa-114b-bcd7-cde3db1bb746-0ae9cdc2"
                className="form-subtitle"
              >
                Fund Lancer Bounty
              </h2>
              {issue.state === IssueState.NEW &&
              (!issue.escrowKey || !issue.escrowContract) ? (
                <LoadingBar title="Loading On Chain Details" />
              ) : (
                <>
                  <div className="issue-creation-type">
                    <div
                      className={classnames("form-subtitle hover-effect", {
                        unselected: fundingType !== "card",
                      })}
                      onClick={() => setFundingType("card")}
                    >
                      Pay With Card
                    </div>
                    <div>OR</div>
                    <div
                      className={classnames("form-subtitle hover-effect", {
                        unselected: fundingType !== "wallet",
                        disabled: true,
                      })}
                      onClick={() => setFundingType("wallet")}
                    >
                      Pay With Phantom Wallet (Coming Soon)
                    </div>
                  </div>

                  {fundingType === "card" && (
                    <>
                      <div>
                        <label>
                          Funding Amount<span className="color-red">*</span>
                        </label>
                        <div>
                          <input
                            type="number"
                            className="input w-input"
                            name="fundingAmount"
                            placeholder="1000 (USD)"
                            id="Issue"
                            value={formData.fundingAmount}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      {formData.fundingAmount && (
                        <FundBounty amount={formData.fundingAmount} />
                      )}
                    </>
                  )}
                  {fundingType === "wallet" && <></>}
                </>
              )}
            </div>
          </>
        </div>
      </div>
    )
  );
};

export default Form;
