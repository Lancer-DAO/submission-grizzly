import { Router } from "express";
import {
  insertAccount,
  getAccount,
  getAllIssuesForRepo,
} from "../../controllers";
import {
  ACCOUNT_API_ROUTE,
} from "../../constants";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import axios from "axios";
import { Octokit } from "octokit";
import { getGitHubUser } from "../../controllers/github";
dayjs.extend(timezone);

const router = Router();

// USERS

router.post(`/${ACCOUNT_API_ROUTE}`, async function (req, res, next) {
  try {
    const body = await req.body;
    const githubId= body.githubId as string;
    const solanaKey = body.solanaKey as string;
    const githubData = await getGitHubUser(githubId);
    const insertData = {
      githubId: githubId,
      solanaKey: solanaKey,
      githubLogin: githubData.data.nickname,
    }
    return res.json(
      await insertAccount(insertData)
    );
  } catch (err) {
    next(err);
  }
});

router.get(`/${ACCOUNT_API_ROUTE}`, async function (req, res, next) {
  try {
    return res.json(
      await getAccount({ githubId: req.query.githubId as string, })
    );
  } catch (err) {
    next(err);
  }
});

router.get(`/${ACCOUNT_API_ROUTE}/organizations`, (req, res) => {
    // first, get the auth0 token

    var github_id = req.query.githubId;
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
    // next, get the github access token

      axios.request(options).then(function (response) {

      const gh_token = response.data.identities[0].access_token;
      const username = response.data.nickname;
      const octokit = new Octokit({
        auth: gh_token,
      });
    // finally, talk to github using the token

      octokit.request('GET /user/repos', {
      }).then((resp) => {

        return res.status(200).json({message: 'Organizations Found', data: resp.data})
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

  router.get(`/${ACCOUNT_API_ROUTE}/organization/repository_issues`, (req, res) => {
    // first, get the auth0 token

    var github_id = req.query.githubId;
    var repo = req.query.repo as string;
    var org = req.query.org as string;
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
    // next, get the github user info

      axios.request(options).then(function (response) {

      const gh_token = response.data.identities[0].access_token;
      const username = response.data.nickname;
      const octokit = new Octokit({
        auth: gh_token,
      });
    // finally, talk to github using the token

      octokit.request('GET /repos/{owner}/{repo}/issues', {
        owner: org,
        repo: repo
      }).then(async (resp) => {
        const rawIssues = await getAllIssuesForRepo(org, repo)
        const issues = rawIssues.message ? [] : rawIssues.map((issue: { issue_number: string; }) => parseInt(issue.issue_number))
        const remainingIssues = resp.data.filter((issue) => !issues.includes(issue.number))
        return res.status(200).json({message: 'Issues Found', data: remainingIssues})
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