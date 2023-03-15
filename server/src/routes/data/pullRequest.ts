import { Router } from "express";
import {
  insertPullRequest,
  getPullRequestByNumber,
  linkPullRequest,
} from "../../controllers";
import {
  LINK_PULL_REQUEST_API_ROUTE,
  PULL_REQUEST_API_ROUTE,
} from "../../constants";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(timezone);

const router = Router();

// PULL REQUEST

router.post(`/${PULL_REQUEST_API_ROUTE}`, async function (req, res, next) {
  try {
    return res.json(
      await insertPullRequest({
         title: req.query.title as string,
         repo: req.query.repo as string,
         org: req.query.org as string,
         pullNumber: parseInt(req.query.pullNumber as string)
        })
    );
  } catch (err) {
    next(err);
  }
});

router.get(`/${PULL_REQUEST_API_ROUTE}`, async function (req, res, next) {
  try {
    return res.json(
      await getPullRequestByNumber({
         repo: req.query.repo as string,
         org: req.query.org as string,
         pullNumber: parseInt(req.query.pullNumber as string)
        })
    );
  } catch (err) {
    next(err);
  }
});

router.put(`/${LINK_PULL_REQUEST_API_ROUTE}`, async function (req, res, next) {
  try {
    return res.json(
      await linkPullRequest({
         title: req.query.title as string,
         repo: req.query.repo as string,
         org: req.query.org as string,
         pullNumber: parseInt(req.query.pullNumber as string)
        })
    );
  } catch (err) {
    next(err);
  }
});

export default router