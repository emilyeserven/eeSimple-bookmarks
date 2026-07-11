/**
 * Open each url in its own new browser tab. Must be called from within a user-gesture click handler.
 *
 * Uses a programmatic anchor click per url rather than `window.open(url, "_blank", "noopener")`:
 * passing a window-features string (e.g. `"noopener"`) makes browsers treat the call as a **popup
 * window** request instead of a new tab — in Arc this surfaces as a "Little Arc" mini-window — and
 * popup blockers throttle rapid `window.open` calls so only the first one or two actually open. A
 * synchronous `<a target="_blank" rel="noopener noreferrer">` click per url opens a real tab and is
 * reliably allowed for several tabs from a single user gesture, while `rel="noopener noreferrer"`
 * preserves the security posture that `window.open`'s `"noopener"` gave.
 *
 * Callers pass only non-empty urls (basketed bookmarks with a null/empty url are skipped upstream).
 */
export function openBasketTabs(urls: string[]): void {
  for (const url of urls) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.style.display = "none";
    document.body.append(link);
    link.click();
    link.remove();
  }
}
