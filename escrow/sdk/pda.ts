import * as anchor from "@project-serum/anchor";
import { AnchorError, IdlTypes, Program } from "@project-serum/anchor";
import { MonoProgram } from "./types/mono_program";

import {
    createAssociatedTokenAccountInstruction,
    getAccount,
    createMint,
    mintToChecked,
    getAssociatedTokenAddress,
    getOrCreateAssociatedTokenAccount,
    TOKEN_PROGRAM_ID,
    NATIVE_MINT,
    createSyncNativeInstruction
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
import { MONO_DATA } from "./constants";




export const findFeatureTokenAccount = async(
    unix_timestamp: String,
    creator: anchor.web3.PublicKey,
    funds_mint: anchor.web3.PublicKey,
    program: Program<MonoProgram>
) : Promise<[anchor.web3.PublicKey, number]> => {

    return await anchor.web3.PublicKey.findProgramAddressSync(
        [
            Buffer.from(MONO_DATA),
            Buffer.from(unix_timestamp),
            creator.toBuffer(),
            funds_mint.toBuffer()
        ],
        program.programId
    );
}

/**
 *
 * @param creator
 * @param program
 * @returns
 */
export const findFeatureAccount = async (
    unix_timestamp: string,
    creator: anchor.web3.PublicKey,
    program: Program<MonoProgram>
) : Promise<[anchor.web3.PublicKey, number]> => {

    return await anchor.web3.PublicKey.findProgramAddressSync(
        [
            Buffer.from(MONO_DATA),
            anchor.utils.bytes.utf8.encode(unix_timestamp),
            creator.toBuffer(),
        ],
        program.programId
    );
}

export const findProgramAuthority = async (
    program: Program<MonoProgram>
)  : Promise<[anchor.web3.PublicKey, number]> => {

    return await anchor.web3.PublicKey.findProgramAddressSync(
        [
            Buffer.from(MONO_DATA)
        ],
        program.programId
    );
}