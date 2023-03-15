import MultiSelectDropdown from "@/src/components/MultiSelectDropdown";
import RangeSlider from "@/src/components/RangeSlider";
import { ISSUE_STATES } from "@/src/constants";
import { capitalize } from "lodash";
import { Filters } from "./bountyTable";

interface BountyFiltersProps {
  mints: string[];
  tags: string[];
  orgs: string[];
  timeBounds: [number, number];
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

export const BountyFilters = ({
  mints,
  tags,
  orgs,
  timeBounds,
  filters,
  setFilters,
}: BountyFiltersProps) => {
  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className="bounty-filters"
    >
      <div className="filter-section">
        <label>Payout Mints</label>
        <MultiSelectDropdown
          options={mints.map((mint) => {
            return {
              value: mint,
              label: mint,
            };
          })}
          selected={filters.mints.map((mint) => {
            return {
              value: mint,
              label: mint,
            };
          })}
          onChange={(options) => {
            setFilters({
              ...filters,
              mints: options.map((option) => option.value),
            });
          }}
        />
      </div>
      <div className="filter-section">
        <label>Creators</label>
        <MultiSelectDropdown
          options={orgs.map((org) => {
            return {
              value: org,
              label: org,
            };
          })}
          selected={filters.orgs.map((org) => {
            return {
              value: org,
              label: org,
            };
          })}
          onChange={(options) => {
            setFilters({
              ...filters,
              orgs: options.map((option) => option.value),
            });
          }}
        />
      </div>
      <div className="filter-section">
        <label>Tags</label>
        <MultiSelectDropdown
          options={tags.map((tag) => {
            return {
              value: tag,
              label: capitalize(tag),
            };
          })}
          selected={filters.tags.map((tag) => {
            return {
              value: tag,
              label: capitalize(tag),
            };
          })}
          onChange={(options) => {
            setFilters({
              ...filters,
              tags: options.map((option) => option.value),
            });
          }}
        />
      </div>
      <div className="filter-section">
        <label>States</label>
        <MultiSelectDropdown
          options={ISSUE_STATES.map((state) => {
            return {
              value: state,
              label: state
                .split("_")
                .map((_state) => capitalize(_state))
                .join(" "),
            };
          })}
          selected={filters.states.map((state) => {
            return {
              value: state,
              label: state
                .split("_")
                .map((_state) => capitalize(_state))
                .join(" "),
            };
          })}
          onChange={(options) => {
            setFilters({
              ...filters,
              states: options.map((option) => option.value),
            });
          }}
        />
      </div>
      <div className="filter-section">
        <label htmlFor="estimatedTime">Estimated Time (hours)</label>
        <div className="range-bounds">
          <div>{timeBounds[0]}</div>
          <div>{timeBounds[1]}</div>
        </div>
        {timeBounds[0] !== 0 && (
          <RangeSlider
            bounds={timeBounds}
            setBounds={(bounds) => {
              setFilters({ ...filters, estimatedTimeBounds: bounds });
            }}
          />
        )}
      </div>
    </form>
  );
};
