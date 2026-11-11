import { els, show } from "./dom";
import { hostPattern, requestServerAccess } from "../lib/hostAccess";
import { setServerUrl, stripTrailingSlash } from "../lib/serverUrl";

/*
 * First-run setup: the user pastes their server URL and clicks Save. Saving also asks for host access
 * to that server (the only host the extension needs up front) — the request starts synchronously in
 * the click, since Chrome only prompts from a user gesture.
 */

/**
 * Show the setup screen. `prefill` re-shows a saved URL whose host access is missing (e.g. declined, or
 * the extension was updated from a build that held blanket host access) with a note to click Save.
 */
export function showSetup(prefill = ""): void {
  els.serverUrl.value = prefill;
  els.setupNote.classList.toggle("hidden", !prefill);
  els.status.textContent = "";
  show("setup");
  els.serverUrl.focus();
}

function onSave(onReady: (serverUrl: string) => void): void {
  const value = stripTrailingSlash(els.serverUrl.value.trim());
  if (!value || !hostPattern(value)) {
    els.status.textContent = "Please enter an http(s) URL.";
    return;
  }
  // Both start inside the gesture. The URL is stored even if the prompt is dismissed (or the popup
  // closes while it's open), so the next open lands back here with it prefilled.
  const access = requestServerAccess(value);
  const stored = setServerUrl(value);
  void Promise.all([access, stored]).then(([granted]) => {
    if (granted) onReady(value);
    else showSetup(value);
  });
}

export function wireSetup(onReady: (serverUrl: string) => void): void {
  els.saveBtn.addEventListener("click", () => onSave(onReady));
  els.serverUrl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") els.saveBtn.click();
  });
}
