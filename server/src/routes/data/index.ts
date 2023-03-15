import { Router } from "express";
import {default as account} from "./account"
import {default as accountIssue} from "./accountIssue"
import {default as accountPullRequest} from "./accountPullRequest"
import {default as issue} from "./issue"
import {default as pullRequest} from "./pullRequest"

const router = Router();
router.use(account)
router.use(accountIssue)
router.use(accountPullRequest)
router.use(issue)
router.use(pullRequest)

export default router