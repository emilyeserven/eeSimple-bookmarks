/* global chrome */
const INBOX_MENU_ID = "eesimple-add-to-inbox";
const BOOKMARK_MENU_ID = "eesimple-add-as-bookmark";

// Each menu item maps to a save endpoint + its success wording. "Inbox" queues for review;
// "as bookmark" bypasses the Inbox and creates a full bookmark directly.
const MENUS = {
  [INBOX_MENU_ID]: {
    path: "/api/bookmarks/inbox",
    saved: "Link queued in Inbox.",
  },
  [BOOKMARK_MENU_ID]: {
    path: "/api/bookmarks/quick-add",
    saved: "Added as bookmark.",
  },
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: INBOX_MENU_ID,
    title: "Add to eeSimple Inbox",
    contexts: ["link"],
  });
  chrome.contextMenus.create({
    id: BOOKMARK_MENU_ID,
    title: "Add to eeSimple as bookmark",
    contexts: ["link"],
  });
});

function notify(message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon48.png",
    title: "eeSimple Bookmarks",
    message,
  });
}

chrome.contextMenus.onClicked.addListener((info) => {
  const menu = MENUS[info.menuItemId];
  if (!menu) return;

  const url = info.linkUrl ?? "";
  const title = info.linkText?.trim() || url;

  chrome.storage.local.get("serverUrl", ({
    serverUrl,
  }) => {
    if (!serverUrl) {
      notify("Click the eeSimple toolbar button first to configure your server URL.");
      return;
    }

    fetch(`${serverUrl}${menu.path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        title,
      }),
    })
      .then((res) => {
        if (res.status === 201) {
          notify(menu.saved);
        }
        else if (res.status === 409) {
          notify("Link already saved.");
        }
        else {
          notify(`Error saving link (${res.status}).`);
        }
      })
      .catch(() => {
        notify("Could not reach the eeSimple server.");
      });
  });
});
