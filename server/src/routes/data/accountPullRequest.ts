import { Router } from "express";

import axios from "axios";
import { Octokit } from "octokit";
import {
    updateIssueState,
    insertAccountPullRequest,
    getAccountPullRequest,
    newPullRequest,
    getFullPullRequestByNumber,
    getIssueByUuid,
  } from "../../controllers";
  import {
    ACCOUNT_PULL_REQUEST_API_ROUTE,
    FULL_PULL_REQUEST_API_ROUTE,
    MERGE_PULL_REQUEST_API_ROUTE,
    NEW_PULL_REQUEST_API_ROUTE,
  } from "../../constants";
const router = Router();




// ACCOUNT PULL REQUEST

router.post(`/${ACCOUNT_PULL_REQUEST_API_ROUTE}`, async function (req, res, next) {
  try {
    return res.json(
      await insertAccountPullRequest({
         repo: req.query.repo as string,
         org: req.query.org as string,githubLogin: req.query.githubLogin as string,
         pullNumber: parseInt(req.query.pullNumber as string),
         amount: parseFloat(req.query.amount as string)
        })
    );
  } catch (err) {
    next(err);
  }
});

router.get(`/${ACCOUNT_PULL_REQUEST_API_ROUTE}`, async function (req, res, next) {
  try {
    return res.json(
      await getAccountPullRequest({
        repo: req.query.repo as string,
        org: req.query.org as string,githubLogin: req.query.githubLogin as string,
        pullNumber: parseInt(req.query.pullNumber as string)
       })
    );
  } catch (err) {
    next(err);
  }
});

router.post(`/${NEW_PULL_REQUEST_API_ROUTE}`, async function (req, res, next) {
  try {
    const data = await req.body;
    return res.json(
      await newPullRequest(data)
    );
  } catch (err) {
    next(err);
  }
});

router.get(`/${FULL_PULL_REQUEST_API_ROUTE}`, async function (req, res, next) {
  try {
    return res.json(
      await getFullPullRequestByNumber({
         repo: req.query.repo as string,
         org: req.query.org as string,
         pullNumber: parseInt(req.query.pullNumber as string),
         githubLogin: req.query.githubLogin as string,
         issueNumber: parseInt(req.query.issueNumber as string)
        })
    );
  } catch (err) {
    next(err);
  }
});

router.post(`/${MERGE_PULL_REQUEST_API_ROUTE}`, async (req, res) => {
  //when a request from auth0 is received we get auth code as query param
  const data = await req.body
  const issue = await getIssueByUuid(data.uuid)

  var pull_number = issue.pull_number;
  var org = issue.org;
  var repo = issue.repo;
  var github_id = data.githubId;

  updateIssueState({
    uuid: data.uuid,
    state: 'complete'
  })
  var options = {
    method: 'POST',
    url: 'https://dev-kgvm1sxe.us.auth0.com/oauth/token',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    data: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.CLIENT_ID || '', //auth0 clientID
      client_secret: process.env.CLIENT_SECRET || '', //auth0 client secret
      audience: `${process.env.BASE_URL}api/v2/`
    })
  };
  axios.request(options).then(function (response) {
    var code = response.data.access_token
    var options = {
      method: 'GET',
      url: `https://dev-kgvm1sxe.us.auth0.com/api/v2/users/${github_id}`,
      headers: {'content-type': 'application/x-www-form-urlencoded', 'Authorization': `Bearer ${code}`},
    };

    axios.request(options).then(function (response) {

    const gh_token = response.data.identities[0].access_token;
    const octokit = new Octokit({
      auth: gh_token,
    });
    octokit.request('PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge', {
      owner: org,
      repo: repo,
      pull_number: pull_number
    }).then((resp) => {
      updateIssueState({
        uuid: data.uuid,
        state: 'complete'
      })

      return res.status(200).json({message: 'Pull Request Merged', data: resp.data})
    }).catch((error) => {

      console.error(error);

      return res.status(500).send({message: error})
    })
    }).catch(function (error) {
      console.error(error);

      return res.status(500).send({message: error})
    })
  }).catch(function (error) {
    console.error(error);
    return res.status(500).send({message: error})

  });
});

export default router