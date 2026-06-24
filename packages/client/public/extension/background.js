/* global chrome */
const MENU_ID = "eesimple-add-to-inbox";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Add to eeSimple Inbox",
    contexts: ["link"],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID) return;

  const url = info.linkUrl ?? "";
  const title = info.linkText?.trim() || url;

  chrome.storage.local.get("serverUrl", ({
    serverUrl,
  }) => {
    if (!serverUrl) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon48.png",
        title: "eeSimple Bookmarks",
        message: "Click the eeSimple toolbar button first to configure your server URL.",
      });
      return;
    }

    fetch(`${serverUrl}/api/bookmarks/inbox`, {
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
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icon48.png",
            title: "eeSimple Bookmarks",
            message: "Link saved to Inbox.",
          });
        }
        else if (res.status === 409) {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icon48.png",
            title: "eeSimple Bookmarks",
            message: "Link already saved.",
          });
        }
        else {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icon48.png",
            title: "eeSimple Bookmarks",
            message: `Error saving link (${res.status}).`,
          });
        }
      })
      .catch(() => {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon48.png",
          title: "eeSimple Bookmarks",
          message: "Could not reach the eeSimple server.",
        });
      });
  });
});
