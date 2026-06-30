import type { Bookmark } from "@eesimple/types";

import { CopyJsonButton } from "./CopyJsonButton";
import { bookmarkToConditionInputJson } from "../lib/debugJson";

/** The "Debug" section of the bookmark detail view — buttons to copy the raw + condition-input JSON. */
export function BookmarkDetailDebug({
  bookmark,
  showHeading = true,
}: {
  bookmark: Bookmark;
  /** When false, the "Debug" label is omitted (use when the tab label already says Debug). */
  showHeading?: boolean;
}) {
  return (
    <div className="space-y-2">
      {showHeading && <p className="text-xs font-medium text-muted-foreground">Debug</p>}
      <div className="flex flex-wrap gap-2">
        <CopyJsonButton
          data={bookmark}
          label="Copy Bookmark JSON"
        />
        <CopyJsonButton
          data={bookmarkToConditionInputJson(bookmark)}
          label="Copy Condition Input JSON"
        />
      </div>
    </div>
  );
}
