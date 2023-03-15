import {
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { MonoProgram } from "@/escrow/sdk/types/mono_program";
import { voteToCancelInstruction,
} from "@/escrow/sdk/instructions";

import { LancerWallet } from "@/src/providers/lancerProvider";
import { EscrowContract } from "@/src/types";


export const voteToCancelFFA = async (creator: PublicKey, voter: PublicKey, acc: EscrowContract, wallet: LancerWallet, anchor: AnchorProvider, program: Program<MonoProgram>) => {


      let approveSubmitterIx = await voteToCancelInstruction(
        acc.unixTimestamp,
        creator,
        voter,
        true,
        program
      )

      const {blockhash, lastValidBlockHeight} = (await anchor.connection.getLatestBlockhash());
      const txInfo = {
                /** The transaction fee payer */
                feePayer: voter,
                /** A recent blockhash */
                blockhash: blockhash,
                /** the last block chain can advance to before tx is exportd expired */
                lastValidBlockHeight: lastValidBlockHeight,
              }
      const tx = await wallet.signAndSendTransaction(
        new Transaction(txInfo).add(approveSubmitterIx)
      );  console.log(tx);

  };