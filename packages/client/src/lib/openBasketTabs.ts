/**
 * Open each url in its own new browser tab. Must be called **synchronously from the real click
 * handler** so every open runs under the click's transient user activation.
 *
 * Two earlier approaches failed in Arc:
 *  - `window.open(url, "_blank", "noopener")` — passing a window-features string makes the browser
 *    open a *popup window* rather than a tab (Arc shows these as "Little Arc" mini-windows), and the
 *    popup blocker then throttles the rest so only one or two land.
 *  - a synthetic `<a target="_blank">` `.click()` — a programmatic click dispatches an *untrusted*
 *    event (`isTrusted === false`), which Arc also routes to Little Arc.
 *
 * Calling `window.open(url, "_blank")` with **no features string** directly in the trusted handler
 * opens a real tab and, because every call shares the one user activation, isn't popup-blocked. We
 * then null the returned window's `opener` to keep the isolation the old `"noopener"` provided
 * (severing `opener` this way does not re-trigger the popup path).
 *
 * Callers pass only non-empty urls (basketed bookmarks with a null/empty url are skipped upstream).
 */
export function openBasketTabs(urls: string[]): void {
  for (const url of urls) {
    const opened = window.open(url, "_blank");
    if (opened) opened.opener = null;
  }
}
