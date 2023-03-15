import {
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { MonoProgram } from "@/escrow/sdk/types/mono_program";
import { denyRequestInstruction } from "@/escrow/sdk/instructions";
import { LancerWallet } from "@/src/providers/lancerProvider";
import { EscrowContract } from "@/src/types";


export const denyRequestFFA = async (creator: PublicKey,submitter: PublicKey, acc: EscrowContract, wallet: LancerWallet, anchor: AnchorProvider, program: Program<MonoProgram>) => {
      let approveSubmitterIx = await denyRequestInstruction(
        acc.unixTimestamp,
        creator,
        submitter,
        program
      )

      const {blockhash, lastValidBlockHeight} = (await anchor.connection.getLatestBlockhash());
      const txInfo = {
                /** The transaction fee payer */
                feePayer: creator,
                /** A recent blockhash */
                blockhash: blockhash,
                /** the last block chain can advance to before tx is exportd expired */
                lastValidBlockHeight: lastValidBlockHeight,
              }
      const tx = await wallet.signAndSendTransaction(
        new Transaction(txInfo).add(approveSubmitterIx)
      );
  };