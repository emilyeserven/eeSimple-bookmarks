import { browser } from "wxt/browser";

import { hasServerAccess } from "../../lib/hostAccess";
import { getServerUrl } from "../../lib/serverUrl";
import { wireAddForm } from "../../popup/addForm";
import { els, show } from "../../popup/dom";
import { bootFillContext } from "../../popup/router";
import { session } from "../../popup/session";
import { showSetup, wireSetup } from "../../popup/setup";

/*
 * The toolbar popup. Boot: no server URL → setup; a URL without host access → setup (prefilled);
 * otherwise read the active tab and route by what the server knows about it (see `popup/router.ts`).
 */

async function start(serverUrl: string): Promise<void> {
  session.serverUrl = serverUrl;
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  session.currentTab = tab ?? null;
  session.pageTitle = tab?.title ?? "";
  const url = (tab?.url ?? "").trim();
  els.bmUrl.value = url;
  if (!url) {
    // No usable URL — the editable add form for manual entry.
    show("form");
    els.bmUrl.focus();
    return;
  }
  await bootFillContext(url);
}

async function boot(): Promise<void> {
  const serverUrl = await getServerUrl();
  if (!serverUrl) {
    showSetup();
    return;
  }
  if (!await hasServerAccess(serverUrl)) {
    showSetup(serverUrl);
    return;
  }
  await start(serverUrl);
}

wireSetup(url => void start(url));
wireAddForm();
void boot();
