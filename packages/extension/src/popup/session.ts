import type { Browser } from "wxt/browser";

import { browser } from "wxt/browser";

/** Per-open popup state: the server, and the tab the popup was opened on. */
export const session: {
  serverUrl: string;
  pageTitle: string;
  currentTab: Browser.tabs.Tab | null;
} = {
  serverUrl: "",
  pageTitle: "",
  currentTab: null,
};

/** Open a server page in a new tab and close the popup. */
export function openServerPage(path: string): void {
  void browser.tabs.create({
    url: `${session.serverUrl}${path}`,
  });
  window.close();
}

/** Open the bookmark in the app (when there is one) and close the popup. */
export function openBookmark(id: string | null | undefined): void {
  if (id) {
    void browser.tabs.create({
      url: `${session.serverUrl}/bookmarks/${id}`,
    });
  }
  window.close();
}
