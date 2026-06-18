import type { HomepageContentSettings } from "@eesimple/types";

import { AddBookmarkCollapsible } from "./AddBookmarkCollapsible";
import { BookmarkForm } from "./BookmarkForm";
import { contentWidthClass } from "../lib/contentWidth";

import { RichTextEditor } from "@/components/ui/RichTextEditor";

interface HomepageContentBlocksProps {
  content: HomepageContentSettings;
}

/**
 * The homepage's top content: the optional Markdown text and the optional Bookmark Quick Add form.
 * Kept in its own module so the homepage can lazy-load it (and the heavy TipTap/BookmarkForm code)
 * only when there is content to show.
 */
export function HomepageContentBlocks({
  content,
}: HomepageContentBlocksProps) {
  const homepageText = content.homepageText.trim() ? content.homepageText : "";

  return (
    <div className="flex flex-wrap gap-4">
      {homepageText
        ? (
          <div className={contentWidthClass(content.homepageTextWidth)}>
            <RichTextEditor
              editable={false}
              value={homepageText}
            />
          </div>
        )
        : null}

      {content.bookmarkQuickAddEnabled
        ? (
          <div className={contentWidthClass(content.bookmarkQuickAddWidth)}>
            {content.bookmarkQuickAddDisplay === "expanded"
              ? <BookmarkForm />
              : <AddBookmarkCollapsible />}
          </div>
        )
        : null}
    </div>
  );
}
