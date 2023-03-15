export * from './helpers'
import {
    insertExistingIssue,
    insertHomeFeed,
    insertFund,
    insertPullRequest,
  } from "./helpers";
  import "./extension.scss";

  let currentPage = "";
  const insertIntoPage = () => {
    const splitURL = window.document.URL.split("/");
    // the inserting is a bit finicky because  there are about 3 page updates each change
    // so sometimes the first insert doesn't actually show up, so we will try again
    // 1 second later to insert. Inserts check for existence before inserting, so wont
    // create a duplicate
    if (splitURL.includes("issues")) {
      if (splitURL.includes("new")) {
        if (currentPage !== "newIssue") {
          insertFund();
          currentPage = "newIssue";
        } else {
          setTimeout(() => {
            insertFund();
          }, 1000);
        }
      } else {
        if (currentPage !== "existingIssue") {
          insertExistingIssue(splitURL);
          currentPage = "existingIssue";
        } else {
          setTimeout(() => {
            insertExistingIssue(splitURL);
          }, 1000);
        }
      }
    } else if (splitURL.includes("pull")) {
      if (currentPage !== "pullRequest") {
        insertPullRequest(splitURL);
        currentPage = "pullRequest";
      } else {
        setTimeout(() => {
          insertPullRequest(splitURL);
        }, 1000);
      }
    } else {
      if (currentPage !== "home") {
        insertHomeFeed();
      } else {
        setTimeout(() => {
          insertHomeFeed();
        }, 1000);
      }
    }
  };

  insertIntoPage();


