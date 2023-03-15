import * as anchor from "@project-serum/anchor";
import { AnchorError, Program } from "@project-serum/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAccount, createInitializeAccount3Instruction, createSyncNativeInstruction, getAccount, getOrCreateAssociatedTokenAccount, NATIVE_MINT, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { MonoProgram } from "../sdk/types/mono_program";
import  MonoProgramJSON  from "../sdk/idl/mono_program.json";
import { MONO_DEVNET, WSOL_ADDRESS } from "../sdk/constants";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from "@solana/web3.js";
import { createKeypair } from "./utils";
import { findFeatureAccount, findFeatureTokenAccount, findProgramAuthority } from "../sdk/pda";
import { addApprovedSubmittersInstruction, approveRequestInstruction, cancelFeatureInstruction, createFeatureFundingAccountInstruction, denyRequestInstruction, fundFeatureInstruction, removeApprovedSubmittersInstruction, submitRequestInstruction, voteToCancelInstruction } from "../sdk/instructions";
import { assert } from "chai";

describe("integration tests", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider =  anchor.getProvider() as anchor.AnchorProvider;

  const program = new Program<MonoProgram>(
        MonoProgramJSON as unknown as MonoProgram, 
        new PublicKey(MONO_DEVNET), 
        provider
    );


  it("test createFFAInstruction works", async () => {
    // Add your test here.
    let creator = await createKeypair(provider);
    const WSOL_AMOUNT = 1;
    const creator_wsol_account = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        creator,
        WSOL_ADDRESS,
        creator.publicKey
    );
    let convert_to_wsol_tx = new Transaction().add(
        // trasnfer SOL
        SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: creator_wsol_account.address,
          lamports: WSOL_AMOUNT * LAMPORTS_PER_SOL,
        }),
        // sync wrapped SOL balance
        createSyncNativeInstruction(creator_wsol_account.address)
    );

    await provider.sendAndConfirm(convert_to_wsol_tx, );

    const ix = await createFeatureFundingAccountInstruction(
      WSOL_ADDRESS,
      creator.publicKey,
      program
    );

    const [program_authority] = await findProgramAuthority(program);
    const tx = await provider.sendAndConfirm(new Transaction().add(ix), [creator]);
    console.log("createFFA transaction signature", tx);
    const accounts = await provider.connection.getParsedProgramAccounts(
      program.programId, // new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
      {
        filters: [
          {
            dataSize: 288, // number of bytes
          },
          {
            memcmp: {
              offset: 8, // number of bytes
              bytes: creator.publicKey.toBase58(), // base58 encoded string
            },
          },
        ],      
      }
    )
      const acc = await program.account.featureDataAccount.fetch(accounts[0].pubkey);
      // Check creator in FFA corresponds to expected creator
      assert.equal(creator.publicKey.toString(), acc.creator.toString());

      const token_account_in_TokenAccount = await getAccount(provider.connection, acc.fundsTokenAccount);
      const token_account_in_Account = await provider.connection.getAccountInfo(token_account_in_TokenAccount.address);

      // Check FFA token Account is owned by program Authority Account
      assert.equal(token_account_in_TokenAccount.owner.toString(), program_authority.toString())
      // Check token account mint corresponds with saved funds mint
      assert.equal(token_account_in_TokenAccount.mint.toString(), acc.fundsMint.toString());
      // Check token account owner is already TOKEN_PROGRAM_ID(already done in getAccount()) 
      assert.equal(token_account_in_Account.owner.toString(), TOKEN_PROGRAM_ID.toString());

      // Checks that program authority Account is owned by program(may fail if program not created on deployment)
      // const program_authority_in_Account = await provider.connection.getAccountInfo(program_authority);
      // assert.equal(program_authority_in_Account.owner.toString(), program.programId.toString())
  });

  it ("test fundFeature Works", async () => {
    let creator = await createKeypair(provider);

    const WSOL_AMOUNT = 1;
    const creator_wsol_account = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        creator,
        WSOL_ADDRESS,
        creator.publicKey
    );
    let convert_to_wsol_tx = new Transaction().add(
        // trasnfer SOL
        SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: creator_wsol_account.address,
          lamports: WSOL_AMOUNT * LAMPORTS_PER_SOL,
        }),
        // sync wrapped SOL balance
        createSyncNativeInstruction(creator_wsol_account.address)
    );

    await provider.sendAndConfirm(convert_to_wsol_tx, );

    const create_FFA_ix = await createFeatureFundingAccountInstruction(
      WSOL_ADDRESS,
      creator.publicKey,
      program
    );
    const tx1 = await provider.sendAndConfirm(new Transaction().add(create_FFA_ix), [creator]);
    console.log("createFFA(2nd test) transaction signature", tx1);

    // transfer 1 WSOL
    let amount = 1 * LAMPORTS_PER_SOL;
    const accounts = await provider.connection.getParsedProgramAccounts(
      program.programId, 
      {
        filters: [
          {
            dataSize: 288, // number of bytes
          },
          {
            memcmp: {
              offset: 8, // number of bytes
              bytes: creator.publicKey.toBase58(), // base58 encoded string
            },
          },
        ],      
      }
    );

    const acc = await program.account.featureDataAccount.fetch(accounts[0].pubkey);
    const [feature_token_account] = await findFeatureTokenAccount(
      acc.unixTimestamp,
      creator.publicKey,
      WSOL_ADDRESS,
      program
    );
    // check balaance before funding feature
    const FFA_token_account_before_balance = await provider.connection.getTokenAccountBalance(feature_token_account)
    let fund_feature_ix = await fundFeatureInstruction(
      amount,
      acc.unixTimestamp,
      creator.publicKey,
      WSOL_ADDRESS,
      program
    );

      const tx2 = await provider.sendAndConfirm(new Transaction().add(fund_feature_ix), [creator]);
      console.log("fundFeature transaction signature", tx2);
      const FFA_token_account_after_balance = await provider.connection.getTokenAccountBalance(feature_token_account)
      assert.equal(
        FFA_token_account_after_balance.value.amount, 
        (
          amount + parseInt(FFA_token_account_before_balance.value.amount)
        ).toString()
      );

  });

  it ("test approveSubmitter", async () => {
        // Add your test here.
        let creator = await createKeypair(provider);
        const WSOL_AMOUNT = 1;
        const creator_wsol_account = await getOrCreateAssociatedTokenAccount(
            provider.connection,
            creator,
            WSOL_ADDRESS,
            creator.publicKey
        );
        let convert_to_wsol_tx = new Transaction().add(
            // trasnfer SOL
            SystemProgram.transfer({
              fromPubkey: provider.publicKey,
              toPubkey: creator_wsol_account.address,
              lamports: WSOL_AMOUNT * LAMPORTS_PER_SOL,
            }),
            // sync wrapped SOL balance
            createSyncNativeInstruction(creator_wsol_account.address)
        );
    
        await provider.sendAndConfirm(convert_to_wsol_tx, );
    
        const ix = await createFeatureFundingAccountInstruction(
          WSOL_ADDRESS,
          creator.publicKey,
          program
        );
    
        const [program_authority] = await findProgramAuthority(program);
    
        let tx = await provider.sendAndConfirm(new Transaction().add(ix), [creator]);
        const accounts = await provider.connection.getParsedProgramAccounts(
          program.programId, 
          {
            filters: [
              {
                dataSize: 288, // number of bytes
              },
              {
                memcmp: {
                  offset: 8, // number of bytes
                  bytes: creator.publicKey.toBase58(), // base58 encoded string
                },
              },
            ],      
          }
        );

        const acc = await program.account.featureDataAccount.fetch(accounts[0].pubkey);

        const [feature_data_account] = await findFeatureAccount(
          acc.unixTimestamp,
          creator.publicKey,
          program
        );

        const submitter1 = await createKeypair(provider);
        let approveSubmitterIx = await addApprovedSubmittersInstruction(
          acc.unixTimestamp,
          creator.publicKey,
          submitter1.publicKey,
          program
        )
        
        tx = await provider.sendAndConfirm(new Transaction().add(approveSubmitterIx), [creator]); 

        let data_account = await program.account.featureDataAccount.fetch(feature_data_account);
        //Testing no of submitters
        let no_of_submitters = 1;
        assert.equal(no_of_submitters, data_account.noOfSubmitters);
        assert.equal(submitter1.publicKey.toString(), data_account.approvedSubmitters[0].toString());
        assert.equal(PublicKey.default.toString(), data_account.approvedSubmitters[1].toString());
        assert.equal(PublicKey.default.toString(), data_account.approvedSubmitters[2].toString());

        // Adding 2nd submitter
        const submitter2 = await createKeypair(provider);
        approveSubmitterIx = await addApprovedSubmittersInstruction(
          acc.unixTimestamp,
          creator.publicKey,
          submitter2.publicKey,
          program
        )
        
        tx = await provider.sendAndConfirm(new Transaction().add(approveSubmitterIx), [creator]); 
        data_account = await program.account.featureDataAccount.fetch(feature_data_account);
        
        no_of_submitters += 1;
        assert.equal(no_of_submitters, data_account.noOfSubmitters);
        assert.equal(submitter1.publicKey.toString(), data_account.approvedSubmitters[0].toString());
        assert.equal(submitter2.publicKey.toString(), data_account.approvedSubmitters[1].toString());
        assert.equal(PublicKey.default.toString(), data_account.approvedSubmitters[2].toString());

        // Adding 3rd submitter
        const submitter3 = await createKeypair(provider);
        approveSubmitterIx = await addApprovedSubmittersInstruction(
          acc.unixTimestamp,
          creator.publicKey,
          submitter3.publicKey,
          program
        )
        
        tx = await provider.sendAndConfirm(new Transaction().add(approveSubmitterIx), [creator]); 
        data_account = await program.account.featureDataAccount.fetch(feature_data_account);
        
        no_of_submitters += 1;
        assert.equal(no_of_submitters, data_account.noOfSubmitters);
        assert.equal(submitter1.publicKey.toString(), data_account.approvedSubmitters[0].toString());
        assert.equal(submitter2.publicKey.toString(), data_account.approvedSubmitters[1].toString());
        assert.equal(submitter3.publicKey.toString(), data_account.approvedSubmitters[2].toString());

        // Adding 4th submitter(should fail)
        const submitter4 = await createKeypair(provider);

      try{
        await program.methods.addApprovedSubmitters()
                .accounts({
                  creator: creator.publicKey,
                  submitter: submitter4.publicKey,
                  featureDataAccount: feature_data_account
                }).signers([creator]).rpc();  
        
      }catch(err){
        assert.equal((err as AnchorError).error.errorMessage, "Max Number of Approved Submitters already reached")
      }
        
    })

  it ("test submitRequest", async () => {
        // Add your test here.
        let creator = await createKeypair(provider);
        const submitter = await createKeypair(provider);
        const WSOL_AMOUNT = 1;
        const creator_wsol_account = await getOrCreateAssociatedTokenAccount(
            provider.connection,
            creator,
            WSOL_ADDRESS,
            creator.publicKey
        );
        const submitter_wsol_account = await getOrCreateAssociatedTokenAccount(
          provider.connection,
          submitter,
          WSOL_ADDRESS,
          submitter.publicKey
        );
        let convert_to_wsol_tx = new Transaction().add(
            // trasnfer SOL
            SystemProgram.transfer({
              fromPubkey: provider.publicKey,
              toPubkey: creator_wsol_account.address,
              lamports: WSOL_AMOUNT * LAMPORTS_PER_SOL,
            }),
            // sync wrapped SOL balance
            createSyncNativeInstruction(creator_wsol_account.address)
        );
    
        await provider.sendAndConfirm(convert_to_wsol_tx, );
    
        const ix = await createFeatureFundingAccountInstruction(
          WSOL_ADDRESS,
          creator.publicKey,
          program
        );
    
        const [program_authority] = await findProgramAuthority(program);
    
        let tx = await provider.sendAndConfirm(new Transaction().add(ix), [creator]);
        const accounts = await provider.connection.getParsedProgramAccounts(
          program.programId, 
          {
            filters: [
              {
                dataSize: 288, // number of bytes
              },
              {
                memcmp: {
                  offset: 8, // number of bytes
                  bytes: creator.publicKey.toBase58(), // base58 encoded string
                },
              },
            ],      
          }
        );
    
        let acc = await program.account.featureDataAccount.fetch(accounts[0].pubkey);
        
        const [feature_data_account] = await findFeatureAccount(
          acc.unixTimestamp,
          creator.publicKey,
          program
        );
    
        
        let approveSubmitterIx = await addApprovedSubmittersInstruction(
          acc.unixTimestamp,
          creator.publicKey,
          submitter.publicKey,
          program
        )
        
        tx = await provider.sendAndConfirm(new Transaction().add(approveSubmitterIx), [creator]); 

        // Should be false already
        assert.equal(acc.requestSubmitted, false);
        const submitRequestIx = await submitRequestInstruction(
            acc.unixTimestamp, 
            creator.publicKey, 
            submitter.publicKey,
            submitter_wsol_account.address,
            program
        )

          tx = await provider.sendAndConfirm(new Transaction().add(submitRequestIx), [submitter])
          acc = await program.account.featureDataAccount.fetch(accounts[0].pubkey);

          assert.equal(acc.requestSubmitted, true);
          assert.equal(acc.currentSubmitter.toString(), submitter.publicKey.toString());
          assert.equal(acc.payoutAccount.toString(), submitter_wsol_account.address.toString())

          try {
            await program.methods.submitRequest()
            .accounts({
              creator: creator.publicKey,
              submitter: submitter.publicKey,
              payoutAccount: submitter_wsol_account.address,
              featureDataAccount: feature_data_account,
            }).signers([submitter]).rpc()
          }catch(err)
          {
            assert.equal((err as AnchorError).error.errorMessage, "There is an active request already present")
          }        
  })

  it ("test approveRequest",async () => {
    let creator = await createKeypair(provider);

    const WSOL_AMOUNT = 1;
    const creator_wsol_account = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        creator,
        WSOL_ADDRESS,
        creator.publicKey
    );
    let convert_to_wsol_tx = new Transaction().add(
        // trasnfer SOL
        SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: creator_wsol_account.address,
          lamports: WSOL_AMOUNT * LAMPORTS_PER_SOL,
        }),
        // sync wrapped SOL balance
        createSyncNativeInstruction(creator_wsol_account.address)
    );

    await provider.sendAndConfirm(convert_to_wsol_tx, );

    const create_FFA_ix = await createFeatureFundingAccountInstruction(
      WSOL_ADDRESS,
      creator.publicKey,
      program
    );
    let tx = await provider.sendAndConfirm(new Transaction().add(create_FFA_ix), [creator]);
    console.log("createFFA(2nd test) transaction signature", tx);

    // transfer 1 WSOL
    let amount = 1 * LAMPORTS_PER_SOL;
    const accounts = await provider.connection.getParsedProgramAccounts(
      program.programId, 
      {
        filters: [
          {
            dataSize: 288, // number of bytes
          },
          {
            memcmp: {
              offset: 8, // number of bytes
              bytes: creator.publicKey.toBase58(), // base58 encoded string
            },
          },
        ],      
      }
    );

    let acc = await program.account.featureDataAccount.fetch(accounts[0].pubkey);

    // Add funds to FFA token account(FundFeature)
    let fund_feature_ix = await fundFeatureInstruction(
      amount,
      acc.unixTimestamp,
      creator.publicKey,
      WSOL_ADDRESS,
      program
    );

      tx = await provider.sendAndConfirm(new Transaction().add(fund_feature_ix), [creator]);
      console.log("fundFeature transaction signature", tx);

      // add pubkey to list of accepted submitters(AddApprovedSubmitters)
      const submitter1 = await createKeypair(provider);
      const submitter1_wsol_account = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        submitter1,
        WSOL_ADDRESS,
        submitter1.publicKey
    );
      let addApproveSubmitterIx = await addApprovedSubmittersInstruction(
        acc.unixTimestamp,
        creator.publicKey,
        submitter1.publicKey,
        program
      )
      
      tx = await provider.sendAndConfirm(new Transaction().add(addApproveSubmitterIx), [creator]); 

      // test approve request fails if there is no submitted request(ApproveRequest)  
      let [feature_data_account] = await findFeatureAccount(
        acc.unixTimestamp,
        creator.publicKey,
        program
      );    
      let [feature_token_account] = await findFeatureTokenAccount(
        acc.unixTimestamp,
        creator.publicKey,
        WSOL_ADDRESS,
        program
      );
      let [program_authority] = await findProgramAuthority(program);
  
      try{
        let approveRequestIx = await program.methods.approveRequest()
        .accounts({
          creator: creator.publicKey,
          submitter: submitter1.publicKey,
          payoutAccount: submitter1_wsol_account.address,
          featureDataAccount: feature_data_account,
          featureTokenAccount: feature_token_account,
          programAuthority: program_authority,
          tokenProgram: TOKEN_PROGRAM_ID,
        }).signers([creator]).rpc();
      }catch(err){
        assert.equal((err as AnchorError).error.errorMessage, "No Request Submitted yet")
      }
      // submit request for merging(SubmitRequest)
      const submitRequestIx = await submitRequestInstruction(
        acc.unixTimestamp, 
        creator.publicKey, 
        submitter1.publicKey,
        submitter1_wsol_account.address,
        program
    )
    acc = await program.account.featureDataAccount.fetch(accounts[0].pubkey);
    tx = await provider.sendAndConfirm(new Transaction().add(submitRequestIx), [submitter1])

      // approve request(merge and send funds)(ApproveRequest)
        const submitter_token_account_before_balance = await provider.connection.getTokenAccountBalance(submitter1_wsol_account.address)
        acc = await program.account.featureDataAccount.fetch(accounts[0].pubkey);

        let approveRequestIx = await approveRequestInstruction(
          acc.unixTimestamp,
          creator.publicKey,
          submitter1.publicKey,
          submitter1_wsol_account.address,
          WSOL_ADDRESS,
          program
        );
        tx = await provider.sendAndConfirm(new Transaction().add(approveRequestIx), [creator])
        console.log("approve Request tx = ", tx);

        const submitter_token_account_after_balance = await provider.connection.getTokenAccountBalance(submitter1_wsol_account.address)
        assert.equal(
          submitter_token_account_after_balance.value.amount, 
          (
            amount + parseInt(submitter_token_account_before_balance.value.amount)
          ).toString()
        );

        let closed_token_account = await provider.connection.getBalance(feature_token_account);
        let closed_data_account = await provider.connection.getBalance(feature_data_account);
   
        assert.equal(0, parseInt(closed_data_account.toString()));
        assert.equal(0, parseInt(closed_token_account.toString()));
  })

  it ("test denyRequest", async () => {
    let creator = await createKeypair(provider);

    const WSOL_AMOUNT = 1;
    const creator_wsol_account = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        creator,
        WSOL_ADDRESS,
        creator.publicKey
    );
    let convert_to_wsol_tx = new Transaction().add(
        // trasnfer SOL
        SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: creator_wsol_account.address,
          lamports: WSOL_AMOUNT * LAMPORTS_PER_SOL,
        }),
        // sync wrapped SOL balance
        createSyncNativeInstruction(creator_wsol_account.address)
    );

    await provider.sendAndConfirm(convert_to_wsol_tx, );

    const create_FFA_ix = await createFeatureFundingAccountInstruction(
      WSOL_ADDRESS,
      creator.publicKey,
      program
    );
    let tx = await provider.sendAndConfirm(new Transaction().add(create_FFA_ix), [creator]);
    console.log("createFFA(2nd test) transaction signature", tx);

    // transfer 1 WSOL
    let amount = 1 * LAMPORTS_PER_SOL;
    const accounts = await provider.connection.getParsedProgramAccounts(
      program.programId, 
      {
        filters: [
          {
            dataSize: 288, // number of bytes
          },
          {
            memcmp: {
              offset: 8, // number of bytes
              bytes: creator.publicKey.toBase58(), // base58 encoded string
            },
          },
        ],      
      }
    );

    let acc = await program.account.featureDataAccount.fetch(accounts[0].pubkey);

    // Add funds to FFA token account(FundFeature)
    let fund_feature_ix = await fundFeatureInstruction(
      amount,
      acc.unixTimestamp,
      creator.publicKey,
      WSOL_ADDRESS,
      program
    );

      tx = await provider.sendAndConfirm(new Transaction().add(fund_feature_ix), [creator]);
      console.log("fundFeature transaction signature", tx);

      // add pubkey to list of accepted submitters(AddApprovedSubmitters)
      const submitter1 = await createKeypair(provider);
      const submitter1_wsol_account = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        submitter1,
        WSOL_ADDRESS,
        submitter1.publicKey
    );
      let addApproveSubmitterIx = await addApprovedSubmittersInstruction(
        acc.unixTimestamp,
        creator.publicKey,
        submitter1.publicKey,
        program
      )
      
      tx = await provider.sendAndConfirm(new Transaction().add(addApproveSubmitterIx), [creator]); 

      // test deny request fails if there is no submitted request(ApproveRequest)  
      let [feature_data_account] = await findFeatureAccount(
        acc.unixTimestamp,
        creator.publicKey,
        program
      );    
      let [feature_token_account] = await findFeatureTokenAccount(
        acc.unixTimestamp,
        creator.publicKey,
        WSOL_ADDRESS,
        program
      );
      let [program_authority] = await findProgramAuthority(program);
  
      try{
        await program.methods.denyRequest()
        .accounts({
          creator: creator.publicKey,
          submitter: submitter1.publicKey,
          featureDataAccount: feature_data_account,
        }).signers([creator]).rpc();
      }catch(err){
        assert.equal((err as AnchorError).error.errorMessage, "No Request Submitted yet")
      }
      // submit request for merging(SubmitRequest)
      const submitRequestIx = await submitRequestInstruction(
        acc.unixTimestamp, 
        creator.publicKey, 
        submitter1.publicKey,
        submitter1_wsol_account.address,
        program
    )
    tx = await provider.sendAndConfirm(new Transaction().add(submitRequestIx), [submitter1])

    // deny Request after Submission(denyRequest)
    let denyRequestIx = await denyRequestInstruction(
      acc.unixTimestamp,
      creator.publicKey,
      submitter1.publicKey,
      program
    );

    tx = await provider.sendAndConfirm(new Transaction().add(denyRequestIx), [creator])
    console.log("denyRequestTx = ", tx);

    acc = await program.account.featureDataAccount.fetch(feature_data_account);
    assert.equal(acc.requestSubmitted, false);
    assert.equal(acc.currentSubmitter.toString(), PublicKey.default.toString());
    assert.equal(acc.payoutAccount.toString(), PublicKey.default.toString());
  })

  it ("test voteToCancel",async () => {
        // Add your test here.
        let creator = await createKeypair(provider);
        const submitter = await createKeypair(provider);
        const WSOL_AMOUNT = 1;
        const creator_wsol_account = await getOrCreateAssociatedTokenAccount(
            provider.connection,
            creator,
            WSOL_ADDRESS,
            creator.publicKey
        );
        const submitter_wsol_account = await getOrCreateAssociatedTokenAccount(
          provider.connection,
          submitter,
          WSOL_ADDRESS,
          submitter.publicKey
        );
        let convert_to_wsol_tx = new Transaction().add(
            // trasnfer SOL
            SystemProgram.transfer({
              fromPubkey: provider.publicKey,
              toPubkey: creator_wsol_account.address,
              lamports: WSOL_AMOUNT * LAMPORTS_PER_SOL,
            }),
            // sync wrapped SOL balance
            createSyncNativeInstruction(creator_wsol_account.address)
        );
    
        await provider.sendAndConfirm(convert_to_wsol_tx, );
    
        const ix = await createFeatureFundingAccountInstruction(
          WSOL_ADDRESS,
          creator.publicKey,
          program
        );
    
        const [program_authority] = await findProgramAuthority(program);
    
        let tx = await provider.sendAndConfirm(new Transaction().add(ix), [creator]);
        const accounts = await provider.connection.getParsedProgramAccounts(
          program.programId, 
          {
            filters: [
              {
                dataSize: 288, // number of bytes
              },
              {
                memcmp: {
                  offset: 8, // number of bytes
                  bytes: creator.publicKey.toBase58(), // base58 encoded string
                },
              },
            ],      
          }
        );
    
        let acc = await program.account.featureDataAccount.fetch(accounts[0].pubkey);
        
        const [feature_data_account] = await findFeatureAccount(
          acc.unixTimestamp,
          creator.publicKey,
          program
        );
    
        
        let approveSubmitterIx = await addApprovedSubmittersInstruction(
          acc.unixTimestamp,
          creator.publicKey,
          submitter.publicKey,
          program
        )
        
        tx = await provider.sendAndConfirm(new Transaction().add(approveSubmitterIx), [creator]); 

        // Should be false already
        assert.equal(acc.requestSubmitted, false);
        const submitRequestIx = await submitRequestInstruction(
            acc.unixTimestamp, 
            creator.publicKey, 
            submitter.publicKey,
            submitter_wsol_account.address,
            program
        )

        tx = await provider.sendAndConfirm(new Transaction().add(submitRequestIx), [submitter])
        
        // creator cancels feature(VoteToCancel)
        let voteToCancelIx = await voteToCancelInstruction(
          acc.unixTimestamp,
          creator.publicKey,
          creator.publicKey,
          true,
          program
        );
        tx = await provider.sendAndConfirm(new Transaction().add(voteToCancelIx), [creator]);

        acc = await program.account.featureDataAccount.fetch(feature_data_account);

        assert.equal(acc.funderCancel, true);
        assert.equal(acc.payoutCancel, false);
        assert.equal(acc.requestSubmitted, true);

        console.log("voteToCancel Tx(1) = ", tx);        

        // submitter cancels feature(VoteToCancel)
        voteToCancelIx = await voteToCancelInstruction(
          acc.unixTimestamp,
          creator.publicKey,
          submitter.publicKey,
          true,
          program
        );
        tx = await provider.sendAndConfirm(new Transaction().add(voteToCancelIx), [submitter]);

        console.log("voteToCancel Tx(2) = ", tx);
        acc = await program.account.featureDataAccount.fetch(feature_data_account);

        assert.equal(acc.funderCancel, true);
        assert.equal(acc.payoutCancel, true);
        assert.equal(acc.payoutAccount.toString(), PublicKey.default.toString());
        assert.equal(acc.currentSubmitter.toString(), PublicKey.default.toString());
        assert.equal(acc.requestSubmitted, false);

  })

  it ("test cancelFeature", async () => {
        // Add your test here.
        let creator = await createKeypair(provider);
        const submitter = await createKeypair(provider);
        const WSOL_AMOUNT = 1;
        const creator_wsol_account = await getOrCreateAssociatedTokenAccount(
            provider.connection,
            creator,
            WSOL_ADDRESS,
            creator.publicKey
        );
        const submitter_wsol_account = await getOrCreateAssociatedTokenAccount(
          provider.connection,
          submitter,
          WSOL_ADDRESS,
          submitter.publicKey
        );
        let convert_to_wsol_tx = new Transaction().add(
            // trasnfer SOL
            SystemProgram.transfer({
              fromPubkey: provider.publicKey,
              toPubkey: creator_wsol_account.address,
              lamports: WSOL_AMOUNT * LAMPORTS_PER_SOL,
            }),
            // sync wrapped SOL balance
            createSyncNativeInstruction(creator_wsol_account.address)
        );
    
        await provider.sendAndConfirm(convert_to_wsol_tx, );
    
        const ix = await createFeatureFundingAccountInstruction(
          WSOL_ADDRESS,
          creator.publicKey,
          program
        );
    
        const [program_authority] = await findProgramAuthority(program);
    
        let tx = await provider.sendAndConfirm(new Transaction().add(ix), [creator]);
        const accounts = await provider.connection.getParsedProgramAccounts(
          program.programId, 
          {
            filters: [
              {
                dataSize: 288, // number of bytes
              },
              {
                memcmp: {
                  offset: 8, // number of bytes
                  bytes: creator.publicKey.toBase58(), // base58 encoded string
                },
              },
            ],      
          }
        );
    
        let acc = await program.account.featureDataAccount.fetch(accounts[0].pubkey);
        
        const [feature_data_account] = await findFeatureAccount(
          acc.unixTimestamp,
          creator.publicKey,
          program
        );
    
        const [feature_token_account] = await findFeatureTokenAccount(
          acc.unixTimestamp,
          creator.publicKey,
          WSOL_ADDRESS,
          program
        );
        
        let approveSubmitterIx = await addApprovedSubmittersInstruction(
          acc.unixTimestamp,
          creator.publicKey,
          submitter.publicKey,
          program
        )
        
        tx = await provider.sendAndConfirm(new Transaction().add(approveSubmitterIx), [creator]); 

        // Should be false already
        assert.equal(acc.requestSubmitted, false);
        const submitRequestIx = await submitRequestInstruction(
            acc.unixTimestamp, 
            creator.publicKey, 
            submitter.publicKey,
            submitter_wsol_account.address,
            program
        )
        let fund_feature_ix = await fundFeatureInstruction(
          WSOL_AMOUNT,
          acc.unixTimestamp,
          creator.publicKey,
          WSOL_ADDRESS,
          program
        );

        tx = await provider.sendAndConfirm(new Transaction().add(fund_feature_ix).add(submitRequestIx), [submitter, creator])
    
        // creator votes to cancel feature(VoteToCancel)
        let voteToCancelIxByCreator = await voteToCancelInstruction(
          acc.unixTimestamp,
          creator.publicKey,
          creator.publicKey,
          true,
          program
        );


        try {
          // testing funder_cancel = true & payout_cancel = false
          await program.methods.cancelFeature()
          .accounts({
            creator: creator.publicKey,
            creatorTokenAccount: creator_wsol_account.address,
            featureDataAccount: feature_data_account,
            featureTokenAccount: feature_token_account,
            programAuthority: program_authority,
            tokenProgram: TOKEN_PROGRAM_ID
          }).signers([creator]).rpc();
            
        } catch (error) {
          assert.equal((error as AnchorError).error.errorMessage, "Cannot Cancel Feature")
        }

        try {
          // testing funder_cancel = true & request_submitted = false
          let denyRequestIx = await denyRequestInstruction(
            acc.unixTimestamp,
            creator.publicKey,
            submitter.publicKey,
            program
          );
          tx = await provider.sendAndConfirm(new Transaction().add(denyRequestIx), [creator])
          await program.methods.cancelFeature()
          .accounts({
            creator: creator.publicKey,
            creatorTokenAccount: creator_wsol_account.address,
            featureDataAccount: feature_data_account,
            featureTokenAccount: feature_token_account,
            programAuthority: program_authority,
            tokenProgram: TOKEN_PROGRAM_ID
          }).signers([creator]).rpc();
            
        } catch (error) {
          assert.equal((error as AnchorError).error.errorMessage, "Cannot Cancel Feature")
        }

        // creator votes to not cancel feature(voteToCancel)
        try{
          let voteToCancelIxBySubmitter = await voteToCancelInstruction(
              acc.unixTimestamp,
              creator.publicKey,
              submitter.publicKey,
              false,
              program
            );
          let creatorRevotesToCancelIx = await voteToCancelInstruction(
            acc.unixTimestamp,
            creator.publicKey,
            creator.publicKey,
            false,
            program
          );

            tx = await provider.sendAndConfirm(
              new Transaction().add(voteToCancelIxByCreator).add(voteToCancelIxBySubmitter).add(creatorRevotesToCancelIx), 
              [creator, submitter]
            );
 
            acc = await program.account.featureDataAccount.fetch(accounts[0].pubkey);
            assert.equal(acc.payoutCancel, false);
            assert.equal(acc.funderCancel, false);
            assert.equal(acc.requestSubmitted, false)
 

            await program.methods.cancelFeature()
              .accounts({
              creator: creator.publicKey,
              creatorTokenAccount: creator_wsol_account.address,
              featureDataAccount: feature_data_account,
              featureTokenAccount: feature_token_account,
              programAuthority: program_authority,
              tokenProgram: TOKEN_PROGRAM_ID
            }).signers([creator]).rpc()
      }catch(err)
      {
        assert.equal((err as AnchorError).error.errorMessage, "Cannot Cancel Feature")
      }
        // submitter votes to cancel Feature(VoteToCancel)
        let voteToCancelIxBySubmitter = await voteToCancelInstruction(
          acc.unixTimestamp,
          creator.publicKey,
          submitter.publicKey,
          true,
          program
        );

        tx = await provider.sendAndConfirm(
          new Transaction().add(voteToCancelIxByCreator).add(voteToCancelIxBySubmitter), 
          [creator, submitter]
        );

        const creator_token_account_before_balance = await provider.connection.getTokenAccountBalance(creator_wsol_account.address)

        let cancelFeatureIx = await cancelFeatureInstruction(
          acc.unixTimestamp,
          creator.publicKey,
          creator_wsol_account.address,
          WSOL_ADDRESS,
          program
        )

        tx = await provider.sendAndConfirm(new Transaction().add(cancelFeatureIx), [creator])
        console.log("cancel Feature Tx = ", tx);

        const creator_token_account_after_balance = await provider.connection.getTokenAccountBalance(creator_wsol_account.address)
        assert.equal(
          creator_token_account_after_balance.value.amount, 
          (
            WSOL_AMOUNT + parseInt(creator_token_account_before_balance.value.amount)
          ).toString()
        );
        let closed_token_account = await provider.connection.getBalance(feature_token_account);
        let closed_data_account = await provider.connection.getBalance(feature_data_account);
   
        assert.equal(0, parseInt(closed_data_account.toString()));
        assert.equal(0, parseInt(closed_token_account.toString()));

  })

  it ("removed approved submitters", async () => {
        // Add your test here.
        let creator = await createKeypair(provider);
        const WSOL_AMOUNT = 1;
        const creator_wsol_account = await getOrCreateAssociatedTokenAccount(
            provider.connection,
            creator,
            WSOL_ADDRESS,
            creator.publicKey
        );
        let convert_to_wsol_tx = new Transaction().add(
            // trasnfer SOL
            SystemProgram.transfer({
              fromPubkey: provider.publicKey,
              toPubkey: creator_wsol_account.address,
              lamports: WSOL_AMOUNT * LAMPORTS_PER_SOL,
            }),
            // sync wrapped SOL balance
            createSyncNativeInstruction(creator_wsol_account.address)
        );
    
        await provider.sendAndConfirm(convert_to_wsol_tx, );
  
        const ix = await createFeatureFundingAccountInstruction(
          WSOL_ADDRESS,
          creator.publicKey,
          program
        );
        const [program_authority] = await findProgramAuthority(program);
        let tx = await provider.sendAndConfirm(new Transaction().add(ix), [creator]);
        console.log("createFFA transaction signature", tx);

        const submitter1 = await createKeypair(provider);
        const submitter2 = await createKeypair(provider);
        const submitter3 = await createKeypair(provider);

        let accounts = await provider.connection.getParsedProgramAccounts(
          program.programId, 
          {
            filters: [
              {
                dataSize: 288, // number of bytes
              },
              {
                memcmp: {
                  offset: 8, // number of bytes
                  bytes: creator.publicKey.toBase58(), // base58 encoded string
                },
              },
            ],      
          }
        );
        let acc = await program.account.featureDataAccount.fetch(accounts[0].pubkey);
        const [feature_data_account] = await findFeatureAccount(
          acc.unixTimestamp,
          creator.publicKey,
          program
        );
        try {
          await program.methods.removeApprovedSubmitters()
            .accounts({
              creator: creator.publicKey,
              submitter: submitter1.publicKey,
              featureDataAccount: feature_data_account
            }).signers([creator]).rpc()
        } catch (err) {
          assert.equal((err as AnchorError).error.errorMessage, "Max Number of Approved Submitters already reached");
        }
        accounts = await provider.connection.getParsedProgramAccounts(
          program.programId, 
          {
            filters: [
              {
                dataSize: 288, // number of bytes
              },
              {
                memcmp: {
                  offset: 8, // number of bytes
                  bytes: creator.publicKey.toBase58(), // base58 encoded string
                },
              },
            ],      
          }
        );
        let approveSubmitterIx1 = await addApprovedSubmittersInstruction(
          acc.unixTimestamp,
          creator.publicKey,
          submitter1.publicKey,
          program
        )
        let approveSubmitterIx2 = await addApprovedSubmittersInstruction(
          acc.unixTimestamp,
          creator.publicKey,
          submitter2.publicKey,
          program
        )
        let approveSubmitterIx3 = await addApprovedSubmittersInstruction(
          acc.unixTimestamp,
          creator.publicKey,
          submitter3.publicKey,
          program
        )

        tx = await provider.sendAndConfirm(
          new Transaction().add(approveSubmitterIx1).add(approveSubmitterIx2).add(approveSubmitterIx3), 
          [creator]
        ); 
        acc = await program.account.featureDataAccount.fetch(accounts[0].pubkey);

        assert.equal(acc.approvedSubmitters[0].toString(), submitter1.publicKey.toString());
        assert.equal(acc.approvedSubmitters[1].toString(), submitter2.publicKey.toString());
        assert.equal(acc.approvedSubmitters[2].toString(), submitter3.publicKey.toString());
    
          let removeApprovedSubmittersIx = await removeApprovedSubmittersInstruction(
            acc.unixTimestamp,
            creator.publicKey,
            submitter1.publicKey,
            program
          );
          tx = await provider.sendAndConfirm(
            new Transaction().add(removeApprovedSubmittersIx), 
            [creator]
          );
          acc = await program.account.featureDataAccount.fetch(accounts[0].pubkey);

          assert.equal(acc.approvedSubmitters[0].toString(), submitter2.publicKey.toString());
          assert.equal(acc.approvedSubmitters[1].toString(), submitter3.publicKey.toString());
          assert.equal(acc.approvedSubmitters[2].toString(), PublicKey.default.toString());

          await program.methods.addApprovedSubmitters()
            .accounts({
              creator: creator.publicKey,
              submitter: submitter1.publicKey,
              featureDataAccount: feature_data_account,
            }).signers([creator]).rpc();
          acc = await program.account.featureDataAccount.fetch(accounts[0].pubkey);

          assert.equal(acc.approvedSubmitters[0].toString(), submitter2.publicKey.toString());
          assert.equal(acc.approvedSubmitters[1].toString(), submitter3.publicKey.toString());
          assert.equal(acc.approvedSubmitters[2].toString(), submitter1.publicKey.toString());
    
          removeApprovedSubmittersIx = await removeApprovedSubmittersInstruction(
            acc.unixTimestamp,
            creator.publicKey,
            submitter3.publicKey,
            program
          );
          tx = await provider.sendAndConfirm(
            new Transaction().add(removeApprovedSubmittersIx), 
            [creator]
          );          
          acc = await program.account.featureDataAccount.fetch(accounts[0].pubkey);
          assert.equal(acc.approvedSubmitters[0].toString(), submitter2.publicKey.toString());
          assert.equal(acc.approvedSubmitters[1].toString(), submitter1.publicKey.toString());
          assert.equal(acc.approvedSubmitters[2].toString(), PublicKey.default.toString());

          await program.methods.addApprovedSubmitters()
          .accounts({
            creator: creator.publicKey,
            submitter: submitter3.publicKey,
            featureDataAccount: feature_data_account,
          }).signers([creator]).rpc();

          acc = await program.account.featureDataAccount.fetch(accounts[0].pubkey);
          assert.equal(acc.approvedSubmitters[0].toString(), submitter2.publicKey.toString());
          assert.equal(acc.approvedSubmitters[1].toString(), submitter1.publicKey.toString());
          assert.equal(acc.approvedSubmitters[2].toString(), submitter3.publicKey.toString());

          removeApprovedSubmittersIx = await removeApprovedSubmittersInstruction(
            acc.unixTimestamp,
            creator.publicKey,
            submitter3.publicKey,
            program
          );
          tx = await provider.sendAndConfirm(
            new Transaction().add(removeApprovedSubmittersIx), 
            [creator]
          );
          acc = await program.account.featureDataAccount.fetch(accounts[0].pubkey);
          assert.equal(acc.approvedSubmitters[0].toString(), submitter2.publicKey.toString());
          assert.equal(acc.approvedSubmitters[1].toString(), submitter1.publicKey.toString());
          assert.equal(acc.approvedSubmitters[2].toString(), PublicKey.default.toString());

  })
});
