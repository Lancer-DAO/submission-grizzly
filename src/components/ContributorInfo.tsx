import { User } from "@/src/types";

export const ContributorInfo: React.FC<{ user: User }> = ({ user }) => {
  return (
    user && (
      <div className="contributor-info">
        <img
          className="contributor-picture-small"
          src={`https://avatars.githubusercontent.com/u/${
            user.githubId.split("|")[1]
          }?s=60&v=4`}
        />
        <div className="contributor-name">{user.githubLogin}</div>
      </div>
    )
  );
};
