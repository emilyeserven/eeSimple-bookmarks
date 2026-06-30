import type { Bookmark } from "@eesimple/types";

import { CopyJsonButton } from "./CopyJsonButton";
import { bookmarkToConditionInputJson } from "../lib/debugJson";

import { Separator } from "@/components/ui/separator";

/** The "Debug" footer of the bookmark detail view — buttons to copy the raw + condition-input JSON. */
export function BookmarkDetailDebug({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  return (
    <>
      <Separator />
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Debug</p>
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
    </>
  );
}
