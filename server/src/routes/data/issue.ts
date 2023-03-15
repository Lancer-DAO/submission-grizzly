import { Router } from "express";
import {
  insertIssue,
  getIssueByNumber,
  getIssueByTitle,
  updateIssueState,
  getAllIssues,
  updateIssueHash,
  newAccountIssue,
  getIssueByUuid,
  updateIssueEscrowKey,
  updateIssueTimestamp,
  getAccountsForIssue,
  getAllIssuesForUser,
} from "../../controllers";
import {
    GITHUB_ISSUE_API_ROUTE,
  ISSUE_API_ROUTE,
} from "../../constants";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import { createGithubIssue } from "../../controllers/github";
dayjs.extend(timezone);

const router = Router();

// ISSUE

router.post(`/${ISSUE_API_ROUTE}`, async function (req, res, next) {
    try {
      return res.json(
        await insertIssue({
           title: req.query.title as string,
           repo: req.query.repo as string,
           org: req.query.org as string,
           tags: req.query.tags as string[],
           private: req.query.private === 'true',
           estimatedTime: parseFloat(req.query.estimatedTime as string),
           description: req.query.description as string
          })
      );
    } catch (err) {
      next(err);
    }
  });

router.post(`/${GITHUB_ISSUE_API_ROUTE}`, async function (req, res, next) {
  try {
    const requestData = req.body;
    let issueNumber = requestData.issueNumber;
    if(requestData.createNewIssue) {
    const issueCreationResp = await createGithubIssue(
        req.body
    );
        issueNumber = issueCreationResp.data.number;
    }
    return res.json(
        await newAccountIssue({...requestData, issueNumber: issueNumber})
    );
  } catch (err) {
    next(err);
  }
});

router.get(`/${ISSUE_API_ROUTE}`, async function (req, res, next) {
  try {
    if(req.query.id) {
      return res.json(
        await getIssueByUuid(req.query.id as string)
      );
    }
    else if(req.query.issueNumber) {
      return res.json(
        await getIssueByNumber({
           title: req.query.title as string,
           repo: req.query.repo as string,
           org: req.query.org as string,
           issueNumber: parseInt(req.query.issueNumber as string)
          })
      );
    }
    return res.json(
      await getIssueByTitle({
         title: req.query.title as string,
         repo: req.query.repo as string,
         org: req.query.org as string
        })
    );
  } catch (err) {
    next(err);
  }
});

router.get(`/${ISSUE_API_ROUTE}/accounts`, async function (req, res, next) {
  try {
      return res.json(
        await getAccountsForIssue(req.query.id as string)
      );
  } catch (err) {
    next(err);
  }
});

router.get(`/${ISSUE_API_ROUTE}s`, async function (req, res, next) {
  try {
    if(req.query.uuid) {
      return res.json(await getAllIssuesForUser(req.query.uuid as string))

    } else {
      return res.json(await getAllIssues())

    }
  } catch (err) {
    next(err);
  }
});



router.put(`/${ISSUE_API_ROUTE}/state`, async function (req, res, next) {
  try {
    const requestData = req.body;
      return res.json(
        await updateIssueState(requestData)
      );

  } catch (err) {
    next(err);
  }
});

router.put(`/${ISSUE_API_ROUTE}/funding_hash`, async function (req, res, next) {
    try {
      const requestData = req.body;
        return res.json(
          await updateIssueHash(requestData)
        );
    } catch (err) {
      next(err);
    }
  });


  router.put(`/${ISSUE_API_ROUTE}/escrow_key`, async function (req, res, next) {
    try {
      const requestData = req.body;
        return res.json(
          await updateIssueEscrowKey(requestData)
        );
    } catch (err) {
      next(err);
    }
  });

  router.put(`/${ISSUE_API_ROUTE}/timestamp`, async function (req, res, next) {
    try {
      const requestData = req.body;
        return res.json(
          await updateIssueTimestamp(requestData)
        );
    } catch (err) {
      next(err);
    }
  });

export default router