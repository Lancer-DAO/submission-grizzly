import { useLancer } from "@/src/providers/lancerProvider";
import { CoinflowWithdraw } from "@coinflowlabs/react";

const Coinflow: React.FC = () => {
  const { anchor, coinflowWallet } = useLancer();
  return (
    !!anchor &&
    !!coinflowWallet && (
      <div className="coinflow-wrapper">
        <CoinflowWithdraw
          wallet={coinflowWallet}
          merchantId="lancer"
          connection={anchor.connection}
          blockchain={"solana"}
          env="sandbox"
        />
      </div>
    )
  );
};

export default Coinflow;
