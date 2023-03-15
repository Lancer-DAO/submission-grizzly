import { Router } from "express";
import {
  insertAccountIssue,
  getAccountIssue,
  newAccountIssue,
  updateAccountIssue,
} from "../../controllers";
import {
  ACCOUNT_ISSUE_API_ROUTE,
  NEW_ISSUE_API_ROUTE,
} from "../../constants";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(timezone);

const router = Router();

// ACCOUNT ISSUE

router.post(`/${ACCOUNT_ISSUE_API_ROUTE}`, async function (req, res, next) {
  try {
    const data = req.body;
    return res.json(
      await insertAccountIssue(data)
    );
  } catch (err) {
    next(err);
  }
});

router.get(`/${ACCOUNT_ISSUE_API_ROUTE}`, async function (req, res, next) {
  try {
    return res.json(
      await getAccountIssue({
         title: req.query.title as string,
         repo: req.query.repo as string,
         org: req.query.org as string,githubLogin: req.query.githubLogin as string,
        })
    );
  } catch (err) {
    next(err);
  }
});

router.put(`/${ACCOUNT_ISSUE_API_ROUTE}`, async function (req, res, next) {
  try {
    const data = await req.body;
    return res.json(
      await updateAccountIssue(data)
    );
  } catch (err) {
    next(err);
  }
});

router.post(`/${NEW_ISSUE_API_ROUTE}`, async function (req, res, next) {
  try {
      const requestData = req.body;
      return res.json(
      await newAccountIssue(requestData)
    );
  } catch (err) {
    next(err);
  }
});

export default router