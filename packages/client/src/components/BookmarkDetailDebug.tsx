import type { Bookmark } from "@eesimple/types";

import { useTranslation } from "react-i18next";

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
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2">
      {showHeading && <p className="text-xs font-medium text-muted-foreground">{t("Debug")}</p>}
      <div className="flex flex-wrap gap-2">
        <CopyJsonButton
          data={bookmark}
          label={t("Copy Bookmark JSON")}
        />
        <CopyJsonButton
          data={bookmarkToConditionInputJson(bookmark)}
          label={t("Copy Condition Input JSON")}
        />
      </div>
    </div>
  );
}
