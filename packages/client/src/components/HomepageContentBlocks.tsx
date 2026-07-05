import type { HomepageContentSettings, HomepageWidget } from "@eesimple/types";

import { resolveHomepageWidgetOrder } from "@eesimple/types";

import { AddBookmarkCollapsible } from "./AddBookmarkCollapsible";
import { BookmarkForm } from "./BookmarkForm";
import { HomepageSearchWidget } from "./HomepageSearchWidget";
import { contentWidthClass } from "../lib/contentWidth";

import { RichTextEditor } from "@/components/ui/RichTextEditor";

interface HomepageContentBlocksProps {
  content: HomepageContentSettings;
}

/**
 * The homepage's top content: the optional Markdown text, the optional Bookmark Quick Add form, and
 * the optional Search from Homepage bar. The widgets render in the order configured on the homepage
 * settings page (`content.widgetOrder`). Kept in its own module so the homepage can lazy-load it
 * (and the heavy TipTap/BookmarkForm code) only when there is content to show.
 */
export function HomepageContentBlocks({
  content,
}: HomepageContentBlocksProps) {
  const homepageText
    = content.homepageTextEnabled && content.homepageText.trim() ? content.homepageText : "";

  function renderWidget(widget: HomepageWidget) {
    switch (widget) {
      case "homepageText":
        return homepageText
          ? (
            <div
              key={widget}
              className={contentWidthClass(content.homepageTextWidth)}
            >
              <RichTextEditor
                editable={false}
                value={homepageText}
              />
            </div>
          )
          : null;
      case "bookmarkQuickAdd":
        return content.bookmarkQuickAddEnabled
          ? (
            <div
              key={widget}
              className={contentWidthClass(content.bookmarkQuickAddWidth)}
            >
              {content.bookmarkQuickAddDisplay === "expanded"
                ? <BookmarkForm />
                : <AddBookmarkCollapsible />}
            </div>
          )
          : null;
      case "search":
        return content.searchEnabled
          ? (
            <div
              key={widget}
              className={contentWidthClass(content.searchWidth)}
            >
              <HomepageSearchWidget />
            </div>
          )
          : null;
      default:
        return null;
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {resolveHomepageWidgetOrder(content.widgetOrder).map(renderWidget)}
    </div>
  );
}
