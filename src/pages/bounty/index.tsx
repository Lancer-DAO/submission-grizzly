import { useRouter } from "next/router";
import Bounty from "@/src/pages/bounty/bounty";
import { LancerProvider } from "@/src/providers/lancerProvider";
import { PageLayout } from "@/src/layouts";

function App() {
  const router = useRouter();
  const { id } = router.query;

  return (
    id !== undefined && (
      <LancerProvider referrer={`bounty?id=${id}`} issueId={id as string}>
        <PageLayout>
          <Bounty />
        </PageLayout>
      </LancerProvider>
    )
  );
}

export default App;
