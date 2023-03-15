import { IssueList } from "./bountyTable";
import { PageLayout } from "@/src/layouts";
import { LancerProvider } from "@/src/providers";

const App: React.FC<{ isMyBounties?: boolean }> = ({ isMyBounties }) => {
  return (
    <LancerProvider referrer={isMyBounties ? `my_bounties` : `bounties`}>
      <PageLayout>
        <IssueList isMyBounties={isMyBounties} />
      </PageLayout>
    </LancerProvider>
  );
};

export default App;
