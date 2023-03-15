import { useLancer } from "@/src/providers/lancerProvider";
import { Transaction } from "@solana/web3.js";
import { CoinflowPurchase } from "@coinflowlabs/react";

const Coinflow: React.FC<{
  transaction: Transaction;
  onSuccess: () => void;
  amount: number;
}> = ({ transaction, onSuccess, amount }) => {
  const { anchor, coinflowWallet } = useLancer();
  console.log(transaction);
  return (
    <div className="coinflow-wrapper">
      <CoinflowPurchase
        wallet={coinflowWallet}
        merchantId="lancer"
        connection={anchor.connection}
        blockchain={"solana"}
        transaction={transaction}
        onSuccess={onSuccess}
        debugTx={true}
        env="sandbox"
        amount={amount}
      />
    </div>
  );
};

export default Coinflow;
