/**
 * Open each url in its own new browser tab. Must be called from within a user-gesture click handler
 * — browsers block `window.open` outside a direct user interaction, and opening several tabs at once
 * may still trip the popup blocker for tabs after the first (accepted limitation). Callers pass only
 * non-empty urls (basketed bookmarks with a null/empty url are skipped upstream).
 */
export function openBasketTabs(urls: string[]): void {
  for (const url of urls) {
    window.open(url, "_blank", "noopener");
  }
}
