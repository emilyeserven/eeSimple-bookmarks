import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

import { getServerUrl } from "../lib/serverUrl";

/*
 * Service worker: the two link context-menu items ("Add to eeSimple Inbox" / "… as bookmark"). Each
 * maps to a save endpoint + its success wording. "Inbox" queues for review; "as bookmark" bypasses the
 * Inbox and creates a full bookmark directly.
 */

const MENUS: Record<string, { title: string;
  path: string;
  saved: string; }> = {
  "eesimple-add-to-inbox": {
    title: "Add to eeSimple Inbox",
    path: "/api/bookmarks/inbox",
    saved: "Link queued in Inbox.",
  },
  "eesimple-add-as-bookmark": {
    title: "Add to eeSimple as bookmark",
    path: "/api/bookmarks/quick-add",
    saved: "Added as bookmark.",
  },
};

function notify(message: string): void {
  void browser.notifications.create({
    type: "basic",
    iconUrl: browser.runtime.getURL("/icon/128.png"),
    title: "eeSimple Bookmarks",
    message,
  });
}

function statusMessage(status: number, saved: string): string {
  if (status === 201) return saved;
  if (status === 409) return "Link already saved.";
  return `Error saving link (${status}).`;
}

async function saveLink(menuItemId: string, url: string, title: string): Promise<void> {
  const menu = MENUS[menuItemId];
  if (!menu) return;
  const serverUrl = await getServerUrl();
  if (!serverUrl) {
    notify("Click the eeSimple toolbar button first to configure your server URL.");
    return;
  }
  try {
    const res = await fetch(`${serverUrl}${menu.path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        title,
      }),
    });
    notify(statusMessage(res.status, menu.saved));
  }
  catch {
    notify("Could not reach the eeSimple server.");
  }
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    for (const [id, menu] of Object.entries(MENUS)) {
      browser.contextMenus.create({
        id,
        title: menu.title,
        contexts: ["link"],
      });
    }
  });

  browser.contextMenus.onClicked.addListener((info) => {
    const url = info.linkUrl ?? "";
    // `linkText` is Firefox-only (absent from Chrome's typings); fall back to the URL as the title.
    const linkText = (info as { linkText?: string }).linkText?.trim();
    void saveLink(String(info.menuItemId), url, linkText || url);
  });
});
