import { TABLE_ISSUE_STATES } from "@/src/constants";
import { getApiEndpoint, getMintName, getUniqueItems } from "@/src/utils";
import { useState } from "react";
import { BountyFilters } from "./bountyFilters";
import { LancerBounty } from "@/src/pages/bounties/lancerBounty";
import { useLancer } from "@/src/providers";
import { useEffect } from "react";
import axios from "axios";
import { ACCOUNT_API_ROUTE, DATA_API_ROUTE } from "@/server/src/constants";
import { LoadingBar } from "@/src/components";
export const ISSUE_USER_RELATIONSHIP = [
  "Creator",
  "Requested Submitter",
  "Approved Submitter",
  "Submitter",
  "None",
];

export type Filters = {
  mints: string[];
  orgs: string[];
  tags: string[];
  states: string[];
  estimatedTimeBounds: [number, number];
  relationships: string[];
};

export const IssueList: React.FC<{ isMyBounties: boolean }> = ({
  isMyBounties,
}) => {
  const { user, issues, setUser } = useLancer();
  const [tags, setTags] = useState<string[]>([]);
  const [mints, setMints] = useState<string[]>([]);
  const [orgs, setOrgs] = useState<string[]>([]);
  const [bounds, setTimeBounds] = useState<[number, number]>([0, 10]);

  const [filters, setFilters] = useState<Filters>({
    mints: mints,
    tags: tags,
    orgs: orgs,
    estimatedTimeBounds: bounds,
    states: TABLE_ISSUE_STATES,
    relationships: ISSUE_USER_RELATIONSHIP,
  });
  useEffect(() => {
    // Get the meta-info off all issues that are used for filters. Specifically
    // - all tags for issues
    // - all orgs posting issues
    // - all payout mints
    // - upper and lower bounds of estimated time completion
    if (issues && issues.length !== 0) {
      const allTags = issues
        .map((issue) => issue.tags)
        .reduce(
          (accumulator, currentValue) => [
            ...accumulator,
            ...(currentValue ? currentValue : []),
          ],
          []
        );
      const uniqueTags = getUniqueItems(allTags);
      const uniqueOrgs = getUniqueItems(issues.map((issue) => issue.org));
      const uniqueMints = getUniqueItems(
        issues.map((issue) => getMintName(issue.mint))
      );
      setTags(uniqueTags);
      setOrgs(uniqueOrgs);
      setMints(uniqueMints);
      const allTimes = issues.map((issue) => issue.estimatedTime);
      const maxTime = Math.max(...allTimes) || 10;
      const minTime = Math.min(...allTimes) || 0;
      const timeBounds: [number, number] = [
        minTime,
        maxTime === minTime ? maxTime + 1 : maxTime,
      ];
      console.log(timeBounds);
      setTimeBounds(timeBounds);
      setFilters({
        mints: uniqueMints,
        tags: allTags,
        orgs: uniqueOrgs,
        estimatedTimeBounds: timeBounds,
        states: TABLE_ISSUE_STATES,
        relationships: ISSUE_USER_RELATIONSHIP,
      });
    }
  }, [issues]);

  useEffect(() => {
    if (user?.githubId) {
      // get the organizations the user is part of, so we know which private issues they can see
      axios
        .get(
          `${getApiEndpoint()}${DATA_API_ROUTE}/${ACCOUNT_API_ROUTE}/organizations`,
          { params: { githubId: user.githubId } }
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
  if (!issues) return <LoadingBar title="Loading Issues" />;

  const filteredIssues = issues.filter((issue) => {
    if (!filters.mints.includes(getMintName(issue.mint))) {
      return false;
    }

    if (!filters.orgs.includes(issue.org)) {
      return false;
    }

    const issueTags = issue.tags || [];
    const commonTags = issueTags.filter((tag) => filters.tags.includes(tag));
    if (commonTags.length === 0 && tags.length !== 0) {
      return false;
    }

    if (!filters.states.includes(issue.state)) {
      return false;
    }
    if (
      issue.estimatedTime < filters.estimatedTimeBounds[0] ||
      issue.estimatedTime > filters.estimatedTimeBounds[1]
    ) {
      return false;
    }

    return true;
  });
  return (
    <div className="bounty-table">
      <div className="empty-cell" />
      <h1 className="page-header">{`${isMyBounties ? "My " : ""}Bounties`}</h1>

      <BountyFilters
        mints={mints}
        tags={tags}
        timeBounds={bounds}
        orgs={orgs}
        filters={filters}
        setFilters={setFilters}
      />
      <div className="issue-list">
        {filteredIssues.map((issue, index) => (
          <LancerBounty issue={issue} key={index} />
        ))}
      </div>
    </div>
  );
};

export default IssueList;
