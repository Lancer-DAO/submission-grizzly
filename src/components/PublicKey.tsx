import { PublicKey } from "@solana/web3.js";
import React from "react";
import { shortenPublicKey } from "@/utils";

export const PubKey: React.FC<{ pubKey: PublicKey; full?: boolean }> = ({
  pubKey,
  full,
}) => {
  const addy = pubKey.toString();

  return (
    <div
      onClick={async () => {
        await navigator.clipboard.writeText(addy);
        alert(`Copied Address: ${addy}`);
      }}
      className="public-key"
    >
      {full ? `Solana Address: ${pubKey}` : shortenPublicKey(pubKey)}
    </div>
  );
};
