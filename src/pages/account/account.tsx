import { DEVNET_USDC_MINT } from "@/src/constants";
import { getSolscanTX } from "@/src/utils";
import { useEffect, useState } from "react";
import { useLancer } from "@/src/providers/lancerProvider";
import {
  getAccount,
  getAssociatedTokenAddress,
  getMint,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { PubKey } from "@/src/components";
import Coinflow from "./coinflowOfframp";
import { PageLayout } from "@/src/layouts";

const FundBounty: React.FC = () => {
  const { wallet, anchor, user, logout } = useLancer();
  const [userSOLBalance, setUserSOLBalance] = useState("0.0");
  const [userUSDCBalance, setUserUSDCBalance] = useState("0.0");
  const [aidropSignature, setAirdropSignature] = useState("");

  useEffect(() => {
    const getWalletUSDCBalance = async () => {
      try {
        const mintKey = new PublicKey(DEVNET_USDC_MINT);
        const token_account = await getAssociatedTokenAddress(
          mintKey,
          user.publicKey
        );
        const account = await getAccount(anchor.connection, token_account);
        const mint = await getMint(anchor.connection, mintKey);
        const decimals = Math.pow(10, mint.decimals);
        console.log(account.amount);
        const balance = account.amount / BigInt(decimals);
        setUserUSDCBalance(balance.toString());
      } catch (e) {
        console.log(e);
        setUserUSDCBalance("Account Not Initialized. Please Use the Faucet");
      }
    };

    if (user?.publicKey && anchor?.connection) {
      getWalletUSDCBalance();
    }
  }, [user?.publicKey, anchor]);

  useEffect(() => {
    const getWalletSOLBalance = async () => {
      const totalBalance = await anchor.connection.getBalance(user.publicKey);
      const balance = totalBalance / 1000000000;
      setUserSOLBalance(balance.toString());
    };
    if (user?.publicKey && anchor?.connection) {
      getWalletSOLBalance();
    }
  }, [user?.publicKey, anchor]);

  const requestAirdrop = async () => {
    console.log("requesting airdrop");
    const airdrop = await anchor.connection.requestAirdrop(
      wallet.publicKey,
      1000000000
    );
    console.log("airdrop signature", airdrop);
    setAirdropSignature(airdrop);
  };
  return (
    user &&
    anchor && (
      <PageLayout>
        <div className="account-page-wrapper">
          {user?.githubLogin && <div>GitHub User: {user.githubLogin}</div>}
          <PubKey pubKey={user.publicKey} full />
          <div className="User Balance">User SOL Balance: {userSOLBalance}</div>
          <button className="button-primary" onClick={() => requestAirdrop()}>
            Request SOL Airdrop
          </button>
          {aidropSignature !== "" && (
            <a
              href={getSolscanTX(aidropSignature)}
              target={"_blank"}
              rel="noreferrer"
            >
              Airdrop: {aidropSignature}
            </a>
          )}
          <div className="User Balance">
            User USDC Balance: {userUSDCBalance}
          </div>
          <a
            href="https://staging.coinflow.cash/faucet"
            target={"_blank"}
            rel="noreferrer"
          >
            USDC Faucet
          </a>
          <Coinflow />
          <button className="button-primary" onClick={() => logout()}>
            Logout
          </button>
        </div>
      </PageLayout>
    )
  );
};

export default FundBounty;
