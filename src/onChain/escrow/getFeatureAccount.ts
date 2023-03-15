import {
  PublicKey,
} from "@solana/web3.js";
import { Program } from "@project-serum/anchor";
import { MonoProgram } from "@/escrow/sdk/types/mono_program";


export const getFeatureFundingAccount = async (featureAccount: PublicKey, program: Program<MonoProgram>) => {
      const acc = await program.account.featureDataAccount.fetch(featureAccount);
      return acc;
  };