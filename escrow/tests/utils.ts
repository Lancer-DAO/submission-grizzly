import * as anchor from "@project-serum/anchor";

export const createKeypair = async (provider: anchor.AnchorProvider) => {
    const keypair = new anchor.web3.Keypair();
    const latestBlockHash = await provider.connection.getLatestBlockhash();
    
    const airdropSignature = await provider.connection.requestAirdrop(
      keypair.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airdropSignature,    
    });
    return keypair;
  };
