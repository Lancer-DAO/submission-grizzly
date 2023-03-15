import * as ReactDOM from "react-dom/client";
import { getApiEndpointExtension, getAppEndpointExtension } from "../utils";
const LIST_ITEM_ID = "bounty-list-item";

// Add a button to the home page that links to the lancer bounty feed
export const insertHomeFeed = () => {
  const existingWrapper = window.document.getElementById(LIST_ITEM_ID);
  console.log("feed", existingWrapper, getApiEndpointExtension());
  if (existingWrapper) {
    return;
  }

  const buttonEle = (
    <a
      data-hydro-click='{"event_type":"feeds.feed_click","payload":{"click_target":"feed.next_tab","originating_url":"https://github.com/","user_id":117492794}}'
      data-hydro-click-hmac="e0cef1b27232baedbc41728bd956018ffa3a13482bfd40d1161fb4d81d36d063"
      id="feed-next"
      type="button"
      role="tab"
      aria-controls="panel-2"
      data-view-component="true"
      className="UnderlineNav-item"
      aria-selected="false"
      tabIndex={-2}
      href={`${getAppEndpointExtension()}bounties`}
      target="_blank"
      rel="noreferrer"
    >
      Bounties
    </a>
  );

  const feedEle = window.document.querySelector('[aria-label="Your Feeds"]');

  if (feedEle) {
    const listItem = window.document.createElement("li");
    listItem.className = `d-inline-flex`;
    listItem.setAttribute("role", "presentation");
    listItem.setAttribute("data-view-component", "true");
    listItem.id = LIST_ITEM_ID;
    feedEle.appendChild(listItem);
    const listInner = ReactDOM.createRoot(listItem);
    listInner.render(buttonEle);
  }
};
