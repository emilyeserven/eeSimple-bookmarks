import { browser } from "wxt/browser";

/** `storage.local` key holding the configured eeSimple server URL (no trailing slash). */
const SERVER_URL_KEY = "serverUrl";

export function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/** The configured server URL, or "" when the extension hasn't been set up yet. */
export async function getServerUrl(): Promise<string> {
  const stored = await browser.storage.local.get(SERVER_URL_KEY);
  const value = stored[SERVER_URL_KEY];
  return typeof value === "string" ? stripTrailingSlash(value) : "";
}

export async function setServerUrl(value: string): Promise<void> {
  await browser.storage.local.set({
    [SERVER_URL_KEY]: stripTrailingSlash(value),
  });
}
