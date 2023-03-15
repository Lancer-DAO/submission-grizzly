import * as anchor from "@project-serum/anchor";
import { AnchorError, IdlTypes, Program } from "@project-serum/anchor";
import { MonoProgram } from "./types/mono_program";

import {
    createAssociatedTokenAccountInstruction,
    getAccount,
    createMint,
    mintToChecked,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    NATIVE_MINT,
    createSyncNativeInstruction,
    ASSOCIATED_TOKEN_PROGRAM_ID
  } from "@solana/spl-token";

  import {
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    Struct,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction,
    TransactionInstruction,
  } from '@solana/web3.js';
import { findFeatureAccount, findFeatureTokenAccount, findProgramAuthority } from "./pda";


export const createFeatureFundingAccountInstruction = async(
  mint: PublicKey,
  creator: PublicKey,
  program: Program<MonoProgram>,
  timestamp: string
): Promise<TransactionInstruction> => {
  const [feature_account] = await findFeatureAccount(
      timestamp,
      creator,
      program
  );
  const [feature_token_account] = await findFeatureTokenAccount(
      timestamp,
      creator,
      mint,
      program,
  );

  const [program_authority] = await findProgramAuthority(
      program,
  );

  return await program.methods.createFeatureFundingAccount(timestamp).
      accounts({
          creator: creator,
          fundsMint: mint,
          featureDataAccount: feature_account,
          featureTokenAccount: feature_token_account,
          programAuthority: program_authority,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
          associatedProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
      })
      .instruction();

}

export const fundFeatureInstruction = async (
  amount: number,
  timestamp: string,
  creator: PublicKey,
  mint: PublicKey,
  program: Program<MonoProgram>
): Promise<TransactionInstruction> => {
  console.log('time',timestamp)
  const [feature_data_account] = await findFeatureAccount(
    timestamp,
    creator,
    program
  );

  const [feature_token_account] = await findFeatureTokenAccount(
    timestamp,
    creator,
    mint,
    program
  );

  const [program_authority] = await findProgramAuthority(program);

  const creator_token_account = await getAssociatedTokenAddress(mint, creator);
  console.log('token_accounts', creator_token_account.toString(), feature_token_account.toString(), program)

  return await program.methods.fundFeature(new anchor.BN(amount))
    .accounts({
      creator: creator,
      creatorTokenAccount: creator_token_account,
      fundsMint: mint,
      featureDataAccount: feature_data_account,
      featureTokenAccount: feature_token_account,
      programAuthority: program_authority,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    }).instruction()
}

export const addApprovedSubmittersInstruction = async (
  timestamp: string,
  creator: PublicKey,
  submitter: PublicKey,
  program: Program<MonoProgram>
): Promise<TransactionInstruction> =>  {
  const [feature_data_account] = await findFeatureAccount(
    timestamp,
    creator,
    program
  );

  return  await program.methods.addApprovedSubmitters()
          .accounts({
            creator: creator,
            submitter: submitter,
            featureDataAccount: feature_data_account
          }).instruction()
}

export const removeApprovedSubmittersInstruction = async (
  timestamp: string,
  creator: PublicKey,
  submitter: PublicKey,
  program: Program<MonoProgram>
): Promise<TransactionInstruction> =>  {
  const [feature_data_account] = await findFeatureAccount(
    timestamp,
    creator,
    program
  );

  return await program.methods.removeApprovedSubmitters()
          .accounts({
            creator: creator,
            submitter: submitter,
            featureDataAccount: feature_data_account
          }).instruction()
}


export const submitRequestInstruction = async (
  timestamp: string,
  creator: PublicKey,
  submitter: PublicKey,
  submitter_token_account: PublicKey,
  program: Program<MonoProgram>
): Promise<TransactionInstruction> =>  {
  const [feature_data_account] = await findFeatureAccount(
    timestamp,
    creator,
    program
  );

  return await program.methods.submitRequest()
  .accounts({
    creator: creator,
    submitter: submitter,
    payoutAccount: submitter_token_account,
    featureDataAccount: feature_data_account,
  }).instruction()

}

export const denyRequestInstruction = async (
  timestamp: string,
  creator: PublicKey,
  submitter: PublicKey,
  program: Program<MonoProgram>
): Promise<TransactionInstruction> =>  {

  const [feature_data_account] = await findFeatureAccount(
    timestamp,
    creator,
    program
  );

  return await program.methods.denyRequest()
  .accounts({
    creator: creator,
    submitter: submitter,
    featureDataAccount: feature_data_account,
  }).instruction();
}

export const approveRequestInstruction = async (
  timestamp: string,
  creator: PublicKey,
  submitter: PublicKey,
  submitter_token_account: PublicKey,
  mint: PublicKey,
  program: Program<MonoProgram>
): Promise<TransactionInstruction> =>  {

  const [feature_data_account] = await findFeatureAccount(
    timestamp,
    creator,
    program
  );

  const [feature_token_account] = await findFeatureTokenAccount(
    timestamp,
    creator,
    mint,
    program,
  );

  const [program_authority] = await findProgramAuthority(
      program,
  );


  return await program.methods.approveRequest()
  .accounts({
    creator: creator,
    submitter: submitter,
    payoutAccount: submitter_token_account,
    featureDataAccount: feature_data_account,
    featureTokenAccount: feature_token_account,
    programAuthority: program_authority,
    tokenProgram: TOKEN_PROGRAM_ID,
  }).instruction();
}

export const voteToCancelInstruction = async (
  timestamp: string,
  creator: PublicKey,
  voter: PublicKey,
  isCancel: boolean,
  program: Program<MonoProgram>
): Promise<TransactionInstruction> =>  {

  const [feature_data_account] = await findFeatureAccount(
    timestamp,
    creator,
    program
  );

  return await program.methods.voteToCancel(isCancel)
  .accounts({
    creator: creator,
    voter: voter,
    featureDataAccount: feature_data_account
  }).instruction();
}

export const cancelFeatureInstruction = async (
  timestamp: string,
  creator: PublicKey,
  creator_token_account: PublicKey,
  mint: PublicKey,
  program: Program<MonoProgram>
): Promise<TransactionInstruction> =>  {

  const [feature_data_account] = await findFeatureAccount(
    timestamp,
    creator,
    program
  );
  const [feature_token_account] = await findFeatureTokenAccount(
    timestamp,
    creator,
    mint,
    program,
);

const [program_authority] = await findProgramAuthority(
    program,
);

  return await program.methods.cancelFeature()
  .accounts({
    creator: creator,
    creatorTokenAccount: creator_token_account,
    featureDataAccount: feature_data_account,
    featureTokenAccount: feature_token_account,
    programAuthority: program_authority,
    tokenProgram: TOKEN_PROGRAM_ID
  }).instruction();
}

