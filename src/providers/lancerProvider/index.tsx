import { ADAPTER_EVENTS, WALLET_ADAPTERS } from "@web3auth/base";
import { Web3AuthCore } from "@web3auth/core";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import {
  createContext,
  FunctionComponent,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CHAIN_CONFIG } from "../../config/chainConfig";
import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { MonoProgram } from "@/escrow/sdk/types/mono_program";
import { getApiEndpoint, getEndpoint } from "@/src/utils";
import { REACT_APP_CLIENTID } from "@/src/constants";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { ACCOUNT_API_ROUTE, DATA_API_ROUTE } from "@/server/src/constants";
import { MONO_DEVNET } from "@/escrow/sdk/constants";
import RPC from "../solanaRPC";
import MonoProgramJSON from "@/escrow/sdk/idl/mono_program.json";
import { Issue, IssueState, Contributor, User } from "@/src/types";
import { SolanaWalletContextState } from "@coinflowlabs/react";
import {
  ILancerContext,
  ISSUE_LOAD_STATE,
  LancerWallet,
  LOGIN_STATE,
} from "@/src/providers/lancerProvider/types";
import {
  getEscrowContract,
  queryIssue,
  queryIssues,
} from "@/src/providers/lancerProvider/queries";
export const REACT_APP_CLIENT_ID =
  "BPMZUkEx6a1aHvk2h_4efBlAJNMlPGvpTOy7qIkz4cbtF_l1IHuZ7KMqsLNPTtDGDItHBMxR6peSZc8Mf-0Oj6U";
export const REACT_APP_CLIENT_ID_DEV =
  "BO2j8ZVZjLmRpGqhclE_xcPdWjGMZYMsDy5ZWgZ7FJSA-zJ2U4huIQAKKuKDe8BSABl60EQXjbFhnx78et4leB0";
export const REACT_APP_VERIFIER = "lancer0";
export const REACT_APP_AUTH0_DOMAIN = "https://dev-kgvm1sxe.us.auth0.com";
export const REACT_APP_SPA_CLIENTID = "ZaU1oZzvlb06tZC8UXtTvTM9KSBY9pzk";
export const REACT_APP_RWA_CLIENTID = "ZaU1oZzvlb06tZC8UXtTvTM9KSBY9pzk";
export * from "./types";

const getUserRelations = (
  user: User,
  issue: Issue,
  userContributor: Contributor
) => {
  // Check and flag all relations the user has to the current issue
  // saves time since these checks only need to happen once, instead of
  // whenever used in code
  const newUser: User = {
    ...user,
    relations: userContributor.relations,
    isCreator: user.uuid === issue.creator.uuid,
    isRequestedSubmitter: issue.requestedSubmitters
      .map((contributor) => contributor.uuid)
      .includes(user.uuid),
    isDeniedRequester: issue.deniedRequesters
      .map((contributor) => contributor.uuid)
      .includes(user.uuid),
    isApprovedSubmitter: issue.approvedSubmitters
      .map((contributor) => contributor.uuid)
      .includes(user.uuid),
    isCurrentSubmitter: user.uuid === issue.currentSubmitter?.uuid,
    isDeniedSubmitter: issue.deniedSubmitters
      .map((contributor) => contributor.uuid)
      .includes(user.uuid),
    isChangesRequestedSubmitter: issue.changesRequestedSubmitters
      .map((contributor) => contributor.uuid)
      .includes(user.uuid),
    isCompleter: user.uuid === issue.completer?.uuid,
    isVotingCancel: issue.cancelVoters
      .map((contributor) => contributor.uuid)
      .includes(user.uuid),
  };
  return newUser;
};

export const LancerContext = createContext<ILancerContext>({
  user: null,
  issue: null,
  issues: [],
  loginState: "logged_out",
  anchor: null,
  program: null,
  web3Auth: null,
  wallet: null,
  issueLoadingState: "initializing",
  coinflowWallet: null,
  login: async () => {},
  logout: async () => {},
  setIssue: () => null,
  setForceGetIssue: () => null,
  setUser: () => null,
  setIssueLoadingState: (state: ISSUE_LOAD_STATE) => null,
});

export function useLancer(): ILancerContext {
  return useContext(LancerContext);
}

interface ILancerState {
  children?: React.ReactNode;
  referrer: string;
  issueId?: string;
}
interface ILancerProps {
  children?: ReactNode;
  referrer: string;
  issueId?: string;
}

export const LancerProvider: FunctionComponent<ILancerState> = ({
  children,
  referrer,
  issueId,
}: ILancerProps) => {
  const [anchor, setAnchor] = useState<AnchorProvider | null>(null);
  const [program, setProgram] = useState<Program<MonoProgram> | null>(null);
  const [wallet, setWallet] = useState<LancerWallet | null>(null);
  const [web3Auth, setWeb3Auth] = useState<Web3AuthCore | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [delayGetUser, setDelayGetUser] = useState(false);
  const [loginState, setLoginState] = useState<LOGIN_STATE | null>(
    "logged_out"
  );
  const [isGettingContract, setIsGettingContract] = useState(false);
  const search = useLocation().search;
  const params = new URLSearchParams(search);
  const jwt = params.get("token");
  type NewType = ISSUE_LOAD_STATE;

  const [issueLoadingState, setIssueLoadingState] =
    useState<NewType>("initializing");
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const connected = useMemo(() => !!publicKey, [publicKey]);
  const [coinflowWallet, setCoinflowWallet] = useState(null);
  const [forceGetIssue, setForceGetIssue] = useState(true);

  const setWalletProvider = useCallback(async () => {
    let provider = web3Auth.provider;
    if (!provider) {
      provider = await web3Auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
        loginProvider: "jwt",
        extraLoginOptions: {
          id_token: jwt,
          domain: REACT_APP_AUTH0_DOMAIN,
          verifierIdField: "sub",
        },
      });
    }
    const walletProvider = new LancerWallet(provider);
    // Give the lancer wallet enough time to connect and initialize
    // before trying to request accounts
    setTimeout(async function () {
      const accounts = await walletProvider.requestAccounts();
      walletProvider.pk = new PublicKey(accounts[0]);
      setWallet(walletProvider);
      setLoginState("getting_user");
    }, 1000);
  }, [web3Auth]);

  useEffect(() => {
    const currentChainConfig = CHAIN_CONFIG["solana"];

    async function init() {
      try {
        // First, start the connection with web3Auth
        const clientId = REACT_APP_CLIENT_ID_DEV;

        const web3AuthInstance = new Web3AuthCore({
          chainConfig: currentChainConfig,
          clientId: clientId,
        });
        const adapter = new OpenloginAdapter({
          adapterSettings: {
            network: "testnet",
            clientId,
            uxMode: "popup",
            loginConfig: {
              jwt: {
                name: "rwa Auth0 Login",
                verifier: "lancer0",
                typeOfLogin: "jwt",
                clientId: REACT_APP_RWA_CLIENTID,
              },
            },
          },
        });

        web3AuthInstance.configureAdapter(adapter);

        await web3AuthInstance.init();

        setWeb3Auth(web3AuthInstance);
        setLoginState("initializing_wallet");
      } catch (error) {
        console.error(error);
      }
    }

    const getUser = async () => {
      // Once we have initialized web3 and constructed our LancerWallet
      // we should get the user information from the backend
      // and populate our user data
      const web3AuthUser = await web3Auth.getUserInfo();
      const user = await axios.get(
        `${getApiEndpoint()}${DATA_API_ROUTE}/${ACCOUNT_API_ROUTE}`,
        {
          params: {
            githubId: web3AuthUser.verifierId,
          },
        }
      );
      if (user.data.message === "NOT FOUND") {
        // this is a newly logged in user
        if (delayGetUser) {
          return;
        }
        // we want to wait until the wallet has set the public key
        // since this needs to be sent to the backend on creation
        if (!wallet.publicKey) {
          setDelayGetUser(true);
          setTimeout(() => {
            setDelayGetUser(false);
          }, 1000);
        } else {
          // create our new user on the backend
          await axios.post(
            `${getApiEndpoint()}${DATA_API_ROUTE}/${ACCOUNT_API_ROUTE}`,
            {
              githubId: web3AuthUser.verifierId,
              solanaKey: wallet.publicKey.toString(),
            }
          );
          const user = await axios.get(
            `${getApiEndpoint()}${DATA_API_ROUTE}/${ACCOUNT_API_ROUTE}`,
            {
              params: {
                githubId: web3AuthUser.verifierId,
              },
            }
          );
          const connection = new Connection(getEndpoint());
          //   airdrop 1 SOL to the new user's wallet so they can sign TX
          const airdrop = await connection.requestAirdrop(
            wallet.publicKey,
            1000000000
          );
          const pk = new PublicKey(user.data.solana_pubkey);
          setUser({
            ...user.data,
            githubId: user.data.github_id,
            githubLogin: user.data.github_login,
            publicKey: pk,
          });
          setPublicKey(pk);
          setLoginState("initializing_anchor");
        }
      } else {
        let newUser = {
          ...user.data,
          githubId: user.data.github_id,
          githubLogin: user.data.github_login,
          publicKey: new PublicKey(user.data.solana_pubkey),
        };
        // If we already have a currently loaded issue,
        // get all relations the user has to the issue
        if (
          issue?.allContributors &&
          issue.allContributors
            .map((contributor) => contributor.uuid)
            .includes(newUser)
        ) {
          const userContributor = issue.allContributors.find(
            (contributor) => contributor.uuid === newUser.uuid
          );
          newUser = getUserRelations(newUser, issue, userContributor);
        }
        setUser(newUser);
        setLoginState("initializing_anchor");
      }
    };
    if (jwt === "" || jwt === null) {
      // If there is not JWT, then we need to request one from Auth0
      const rwaURL = `${REACT_APP_AUTH0_DOMAIN}/authorize?scope=openid&response_type=code&client_id=${REACT_APP_CLIENTID}&redirect_uri=${`${getApiEndpoint()}callback?referrer=${referrer}`}&state=STATE`;
      setLoginState("retrieving_jwt");
      window.location.href = rwaURL;
    } else if (
      jwt !== "" &&
      (loginState === "logged_out" || loginState === "retrieving_jwt")
    ) {
      // if we have the jwt, but have not logged in, then we need to
      // pass the jwt to the backend and log in. then we can initialize
      //   web3auth on the frontend
      init();
    } else if (loginState === "initializing_wallet") {
      // now that we initialized web3auth, we need to set up the wallet and provider
      setWalletProvider();
    } else if (loginState === "getting_user") {
      // now that we have the web3auth info, get any other info from the backend
      getUser();
    } else if (loginState === "initializing_anchor") {
      // now that we have everything, we can initialize our anchor provider and coinflow wallet

      const connection = new Connection(getEndpoint());

      const provider = new AnchorProvider(connection, wallet, {});
      const program = new Program<MonoProgram>(
        MonoProgramJSON as unknown as MonoProgram,
        new PublicKey(MONO_DEVNET),
        provider
      );
      setAnchor(provider);
      setProgram(program);

      const rpc = new RPC(web3Auth.provider);
      const sendTransaction = async (transaction: Transaction) => {
        return await rpc.sendTransaction(transaction);
      };

      const signTransaction = async <
        T extends Transaction | VersionedTransaction
      >(
        transaction: T
      ): Promise<T> => {
        return await rpc.signTransaction(transaction);
      };
      const signMessage = async (message: string | Uint8Array) => {
        return await rpc.signMessage(message);
      };
      const coinflowWallet: SolanaWalletContextState = {
        wallet: null,
        connected: true,
        publicKey: wallet.pk,
        sendTransaction,
        signMessage,
        signTransaction,
      };
      setCoinflowWallet(coinflowWallet);
      //   we are now ready to have fun!
      setLoginState("ready");
    }
  }, [
    jwt,
    issue,
    loginState,
    wallet?.pubkey,
    delayGetUser,
    setDelayGetUser,
    setWalletProvider,
    setAnchor,
    setProgram,
    setLoginState,
    setUser,
    setWeb3Auth,
  ]);

  useEffect(() => {
    const getContract = async () => {
      // if the contract is completed or canceled, the account will be closed and this
      // will cause an error
      if (
        issue.state === IssueState.COMPLETE ||
        issue.state === IssueState.CANCELED
      ) {
        setIssueLoadingState("loaded");
        setIsGettingContract(false);
        return;
      }
      if (
        // We haven't loaded info from on chain yet
        (!issue.escrowContract && issue.creator) ||
        // We just submitted a request, but the on chain query is still updating
        (issue.escrowContract &&
          issue.state === IssueState.AWAITING_REVIEW &&
          issue.escrowContract.currentSubmitter.toString() ===
            "11111111111111111111111111111111") ||
        // We just denied a request, but the on chain query is still updating
        (issue.escrowContract &&
          issue.state === IssueState.IN_PROGRESS &&
          issue.escrowContract.currentSubmitter.toString() !==
            "11111111111111111111111111111111")
      ) {
        // set this so we only send one request at a time
        setIsGettingContract(true);

        const newIssue = await getEscrowContract(issue, program, anchor);
        // if we are in one of the below states, then there is a mismatch
        // between the backend and what is on chain. This usually happens
        // when a change occurs on chain and in the backend, and the changes
        // are not reflected on chain yet
        if (
          !newIssue ||
          (issue.cancelVoters.length === 0 &&
            newIssue.state === IssueState.AWAITING_REVIEW &&
            newIssue.escrowContract.currentSubmitter.toString() ===
              "11111111111111111111111111111111") ||
          (issue.cancelVoters.length === 0 &&
            newIssue.state === IssueState.IN_PROGRESS &&
            newIssue.escrowContract.currentSubmitter.toString() !==
              "11111111111111111111111111111111")
        ) {
          setTimeout(() => {
            setIsGettingContract(false);
          }, 2000);
        } else {
          setIssue(newIssue);
          setIssueLoadingState("loaded");
          setIsGettingContract(false);
        }
      }
    };
    if (
      issue &&
      (issue.state === IssueState.COMPLETE ||
        issue.state === IssueState.CANCELED)
    ) {
      setIssueLoadingState("loaded");
      return;
    }
    if (
      issue &&
      program &&
      anchor &&
      anchor.connection &&
      issueLoadingState === "getting_contract" &&
      !isGettingContract
    ) {
      getContract();
    }
  }, [
    !!program,
    !!issue,
    !!anchor,
    issueLoadingState,
    setIssueLoadingState,
    isGettingContract,
    setIsGettingContract,
    setIssue,
  ]);

  useEffect(() => {
    const query = async () => {
      setIssueLoadingState("getting_issue");
      //   get information on the current issue from the backend
      const issue = await queryIssue(issueId as string);
      setIssue(issue);
      //   if the user is loaded, then get all relations to the current issue
      if (
        user?.uuid &&
        issue?.allContributors
          .map((contributor) => contributor.uuid)
          .includes(user.uuid)
      ) {
        const userContributor = issue.allContributors.find(
          (contributor) => contributor.uuid === user.uuid
        );

        const updatedUser = getUserRelations(user, issue, userContributor);

        setUser(updatedUser);
      } else {
        setUser({ ...user, relations: [] });
      }
      setIssueLoadingState("getting_contract");
    };
    if (issueId !== undefined && anchor && program && forceGetIssue) {
      setForceGetIssue(false);
      query();
    }
  }, [
    issueId,
    anchor,
    program,
    issue?.state,
    !!user,
    setUser,
    forceGetIssue,
    setForceGetIssue,
  ]);

  useEffect(() => {
    const query = async () => {
      // either get all issues, or issues the current user has a relation with
      const issues = await queryIssues(user, referrer);
      setIssues(issues);
    };
    if (user?.uuid && user?.repos) {
      query();
    }
  }, [user, referrer]);

  const login = async () => {
    const rwaURL = `${REACT_APP_AUTH0_DOMAIN}/authorize?scope=openid&response_type=code&client_id=${REACT_APP_CLIENTID}&redirect_uri=${`${getApiEndpoint()}callback?referrer=${referrer}`}&state=STATE`;
    window.location.href = rwaURL;
  };

  const logout = async () => {
    if (!web3Auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    await web3Auth.logout();
    // if (sessionStorage.getItem("app") === "RWA") {
    window.location.href = REACT_APP_AUTH0_DOMAIN + "/v2/logout?federated";
    // }
    setAnchor(null);
    setWeb3Auth(null);
    setUser(null);
    setWallet(null);
    setProgram(null);
    window.sessionStorage.clear();
    window.location.href = "/";
  };

  const contextProvider = {
    web3Auth,
    wallet,
    anchor,
    program,
    user,
    setUser,
    loginState,
    login,
    logout,
    issue,
    issues,
    setIssue,
    issueLoadingState,
    setIssueLoadingState,
    coinflowWallet,
    setForceGetIssue,
  };
  return (
    <LancerContext.Provider value={contextProvider}>
      {children}
    </LancerContext.Provider>
  );
};
